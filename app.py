from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
from datetime import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'

DATABASE = 'instance/cars.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name')
    
    if not username or not password or not full_name:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'Username already exists'}), 400
    
    hashed_password = generate_password_hash(password)
    cursor.execute(
        'INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)',
        (username, hashed_password, full_name)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Registration successful! Please login.'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'success': False, 'message': 'User not registered. Please register first.'}), 401
    
    if not check_password_hash(user['password'], password):
        return jsonify({'success': False, 'message': 'Invalid password'}), 401
    
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['full_name'] = user['full_name']
    
    return jsonify({'success': True, 'message': 'Login successful'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('dashboard.html', username=session.get('full_name'))

@app.route('/api/cars', methods=['GET'])
def get_cars():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cars = conn.execute('SELECT * FROM cars WHERE available = 1').fetchall()
    conn.close()
    
    cars_list = [dict(car) for car in cars]
    return jsonify({'success': True, 'cars': cars_list})

@app.route('/api/book', methods=['POST'])
def book_car():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.json
    car_id = data.get('car_id')
    pickup_date = data.get('pickup_date')
    pickup_time = data.get('pickup_time')
    period = data.get('period')
    city_pick = data.get('city_pick')
    exact_pick = data.get('exact_pick')
    city_drop = data.get('city_drop')
    exact_drop = data.get('exact_drop')
    kilometers = float(data.get('kilometers', 0))
    
    if period not in ['Morning', 'Evening', 'Afternoon', 'Night']:
        return jsonify({'success': False, 'message': 'Invalid period'}), 400
    
    valid_cities = ['Delhi', 'Noida', 'Greater Noida', 'Mathura']
    if city_pick not in valid_cities or city_drop not in valid_cities:
        return jsonify({'success': False, 'message': 'Service not available at this location'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM cars WHERE car_id = ? AND available = 1', (car_id,))
    car = cursor.fetchone()
    
    if not car:
        conn.close()
        return jsonify({'success': False, 'message': 'Car not available'}), 400
    
    price_per_km = car['price_per_km']
    base_price = kilometers * price_per_km
    gst = 0.18 * base_price
    
    toll_charges = 0
    if (city_pick == "Delhi" and city_drop == "Mathura") or (city_pick == "Mathura" and city_drop == "Delhi"):
        toll_charges = 500
    elif (city_pick == "Mathura" and city_drop == "Noida") or (city_pick == "Noida" and city_drop == "Mathura"):
        toll_charges = 480
    
    total_amount = base_price + gst + toll_charges
    
    cursor.execute('''
        INSERT INTO bookings 
        (user_id, username, car_id, booking_date, pickup_date, pickup_time, period, 
         city_pick, exact_pick, city_drop, exact_drop, kilometers, toll_charges, 
         base_price, gst, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (session['user_id'], session['username'], car_id, datetime.now().strftime('%Y-%m-%d'),
          pickup_date, pickup_time, period, city_pick, exact_pick, city_drop, exact_drop,
          kilometers, toll_charges, base_price, gst, total_amount))
    
    booking_id = cursor.lastrowid
    
    cursor.execute('UPDATE cars SET available = 0 WHERE car_id = ?', (car_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'booking_id': booking_id,
        'message': 'Booking successful!',
        'booking_details': {
            'booking_id': booking_id,
            'car_id': car_id,
            'pickup_date': pickup_date,
            'pickup_time': pickup_time,
            'period': period,
            'pickup_location': f"{exact_pick}, {city_pick}",
            'drop_location': f"{exact_drop}, {city_drop}",
            'kilometers': kilometers,
            'base_price': round(base_price, 2),
            'gst': round(gst, 2),
            'toll_charges': toll_charges,
            'total_amount': round(total_amount, 2)
        }
    })

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    bookings = conn.execute('''
        SELECT b.*, c.make, c.model 
        FROM bookings b
        JOIN cars c ON b.car_id = c.car_id
        WHERE b.user_id = ? AND b.status = 'active'
        ORDER BY b.booking_id DESC
    ''', (session['user_id'],)).fetchall()
    conn.close()
    
    bookings_list = [dict(booking) for booking in bookings]
    return jsonify({'success': True, 'bookings': bookings_list})

@app.route('/api/cancel/<int:booking_id>', methods=['POST'])
def cancel_booking(booking_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?', 
                   (booking_id, session['user_id']))
    booking = cursor.fetchone()
    
    if not booking:
        conn.close()
        return jsonify({'success': False, 'message': 'Booking not found'}), 404
    
    cursor.execute('UPDATE bookings SET status = ? WHERE booking_id = ?', 
                   ('cancelled', booking_id))
    
    cursor.execute('UPDATE cars SET available = 1 WHERE car_id = ?', 
                   (booking['car_id'],))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Booking cancelled successfully'})

if __name__ == '__main__':
    if not os.path.exists('instance'):
        os.makedirs('instance')
    app.run(debug=True)
