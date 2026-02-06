import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('instance/cars.db')
    cursor = conn.cursor()
    
    # Users table for authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Cars table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cars (
            car_id TEXT PRIMARY KEY,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            available BOOLEAN DEFAULT 1,
            price_per_km REAL NOT NULL
        )
    ''')
    
    # Bookings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            car_id TEXT NOT NULL,
            booking_date DATE NOT NULL,
            pickup_date TEXT NOT NULL,
            pickup_time TEXT NOT NULL,
            period TEXT NOT NULL,
            city_pick TEXT,
            exact_pick TEXT,
            city_drop TEXT,
            exact_drop TEXT,
            kilometers REAL,
            toll_charges REAL DEFAULT 0,
            base_price REAL,
            gst REAL,
            total_amount REAL,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (car_id) REFERENCES cars(car_id)
        )
    ''')
    
    # Insert initial car data if not exists
    cars_data = [
        ('Car1', 'Toyota', 'Camry', 1, 13),
        ('Car2', 'Honda', 'Accord', 1, 9),
        ('Car3', 'Maruti Suzuki', 'WagonR', 1, 10),
        ('Car4', 'Maruti Suzuki', 'Swift', 1, 9),
        ('Car5', 'Hyundai', 'Creta', 1, 13),
        ('Car6', 'Maruti Suzuki', 'Swift Dzire', 1, 9),
        ('Car7', 'Mahindra', 'TUV 300', 1, 13),
        ('Car8', 'Toyota', 'Innova', 1, 13),
        ('Car9', 'Tata', 'Safari', 1, 10),
        ('Car10', 'Maruti Suzuki', 'Ertiga', 1, 13)
    ]
    
    cursor.execute('SELECT COUNT(*) FROM cars')
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            'INSERT INTO cars (car_id, make, model, available, price_per_km) VALUES (?, ?, ?, ?, ?)',
            cars_data
        )
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()
