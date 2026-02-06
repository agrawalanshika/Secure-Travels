// Login Form Handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('message');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';
                showLoader("Logging in...");
animateAndRedirect('/dashboard', 'Logging in...');

            } else {
                messageDiv.textContent = data.message;
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    });
}

// Register Form Handler
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const full_name = document.getElementById('full_name').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm_password').value;
        const messageDiv = document.getElementById('message');
        
        if (password !== confirm_password) {
            messageDiv.textContent = 'Passwords do not match!';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, full_name })
            });
            
            const data = await response.json();
            
            if (data.success) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                messageDiv.textContent = data.message;
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    });
}

// Dashboard Functions
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (tabName === 'book') {
        document.getElementById('bookTab').classList.add('active');
        document.querySelectorAll('.tab-button')[0].classList.add('active');
        loadCars();
    } else if (tabName === 'bookings') {
        document.getElementById('bookingsTab').classList.add('active');
        document.querySelectorAll('.tab-button')[1].classList.add('active');
        loadBookings();
    }
}

// Load available cars
async function loadCars() {
    const carsList = document.getElementById('carsList');
    carsList.innerHTML = '<div class="loading"></div>';
    
    try {
        const response = await fetch('/api/cars');
        const data = await response.json();
        
        if (data.success && data.cars.length > 0) {
            carsList.innerHTML = data.cars.map(car => `
    <div class="car-card"
         onclick="selectCar('${car.car_id}', '${car.make}', '${car.model}')">
        <h3>${car.make} ${car.model}</h3>
        <p>Car ID: ${car.car_id}</p>
        <p class="price">₹${car.price_per_km}/km</p>
    </div>
`).join('');
        } else {
            carsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚗</div><p>No cars available at the moment</p></div>';
        }
    } catch (error) {
        carsList.innerHTML = '<div class="empty-state"><p>Error loading cars</p></div>';
    }
}

// Select car for booking
// Select car for booking
function selectCar(carId, make, model) {
    // Set selected car ID
    document.getElementById('selected_car_id').value = carId;

    // Show selected car name
    document.getElementById('selectedCarName').innerText = `${make} ${model}`;

    // Show booking section
    document.getElementById('bookingSection').style.display = 'block';
    document.getElementById('bookingSection').scrollIntoView({ behavior: 'smooth' });

    // Set minimum pickup date as today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pickup_date').setAttribute('min', today);
}


// Cancel booking form
function cancelBooking() {
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingSection').style.display = 'none';
}

// Booking Form Handler
if (document.getElementById('bookingForm')) {
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            car_id: document.getElementById('selected_car_id').value,
            pickup_date: document.getElementById('pickup_date').value,
            pickup_time: document.getElementById('pickup_time').value,
            period: document.getElementById('period').value,
            city_pick: document.getElementById('city_pick').value,
            exact_pick: document.getElementById('exact_pick').value,
            city_drop: document.getElementById('city_drop').value,
            exact_drop: document.getElementById('exact_drop').value,
            kilometers: document.getElementById('kilometers').value
        };
        
        try {
    // 🔵 Show loader with animation
    showLoader("Confirming your booking...");

    const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    const data = await response.json();

    // ⏳ Smooth delay for UX
    setTimeout(() => {
        document.getElementById('loaderModal').style.display = 'none';

        if (data.success) {
            showReceipt(data.booking_details);
            document.getElementById('bookingForm').reset();
            document.getElementById('bookingSection').style.display = 'none';
            loadCars();
        } else {
            alert(data.message);
        }
    }, 900);

} catch (error) {
    document.getElementById('loaderModal').style.display = 'none';
    alert('An error occurred. Please try again.');
}

    });
}

// Show receipt modal
function showReceipt(details) {
    const modal = document.getElementById('receiptModal');
    const content = document.getElementById('receiptContent');
    
    content.innerHTML = `
        <div class="receipt">
            <h2>🎉 Booking Confirmed!</h2>
            <div class="receipt-row">
                <span class="receipt-label">Booking ID:</span>
                <span class="receipt-value">#${details.booking_id}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Car:</span>
                <span class="receipt-value">${details.car_id}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Pickup Date & Time:</span>
                <span class="receipt-value">${details.pickup_date} at ${details.pickup_time}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Period:</span>
                <span class="receipt-value">${details.period}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Pickup Location:</span>
                <span class="receipt-value">${details.pickup_location}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Drop Location:</span>
                <span class="receipt-value">${details.drop_location}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Distance:</span>
                <span class="receipt-value">${details.kilometers} km</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Base Price:</span>
                <span class="receipt-value">₹${details.base_price}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">GST (18%):</span>
                <span class="receipt-value">₹${details.gst}</span>
            </div>
            <div class="receipt-row">
                <span class="receipt-label">Toll Charges:</span>
                <span class="receipt-value">₹${details.toll_charges}</span>
            </div>
            <div class="receipt-row receipt-total">
                <span class="receipt-label">Total Amount:</span>
                <span class="receipt-value">₹${details.total_amount}</span>
            </div>
            <p class="thank-you">Thank you for choosing Secure Travels! We look forward to serving you.</p>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close receipt modal
function closeReceipt() {
    document.getElementById('receiptModal').style.display = 'none';
}


// Load user bookings
async function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '<div class="loading"></div>';
    
    try {
        const response = await fetch('/api/bookings');
        const data = await response.json();
        
        if (data.success && data.bookings.length > 0) {
            bookingsList.innerHTML = data.bookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-header">
                        <span class="booking-id">Booking #${booking.booking_id}</span>
                        <button onclick="openCancelModal(${booking.booking_id})" class="btn btn-danger">Cancel</button>

                    </div>
                    <div class="booking-details">
                        <div class="detail-item">
                            <span class="detail-label">Car</span>
                            <span class="detail-value">${booking.make} ${booking.model}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Pickup Date</span>
                            <span class="detail-value">${booking.pickup_date} at ${booking.pickup_time}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Period</span>
                            <span class="detail-value">${booking.period}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">From</span>
                            <span class="detail-value">${booking.exact_pick}, ${booking.city_pick}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">To</span>
                            <span class="detail-value">${booking.exact_drop}, ${booking.city_drop}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Distance</span>
                            <span class="detail-value">${booking.kilometers} km</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Total Amount</span>
                            <span class="detail-value">₹${booking.total_amount}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            bookingsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No bookings yet. Start by booking a car!</p></div>';
        }
    } catch (error) {
        bookingsList.innerHTML = '<div class="empty-state"><p>Error loading bookings</p></div>';
    }
}

// Cancel booking by ID
// Cancel booking (called after confirmation modal)
async function cancelBookingById(bookingId) {
    try {
        document.getElementById('cancelLoader').style.display = 'block';


        const response = await fetch(`/api/cancel/${bookingId}`, {
            method: 'POST'
        });

        const data = await response.json();

        setTimeout(() => {
           document.getElementById('cancelLoader').style.display = 'none';

            if (data.success) {
                loadBookings();
                loadCars();
            } else {
                alert(data.message);
            }
        }, 800);

    } catch (error) {
        document.getElementById('loaderModal').style.display = 'none';
        alert('An error occurred. Please try again.');
    }
}




// Logout function
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    animateAndRedirect('/', 'Logging out...');


    setTimeout(() => {
        window.location.href = '/';
    }, 1500);
}


// Initialize dashboard
if (window.location.pathname === '/dashboard') {
    loadCars();
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('receiptModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ================= LOADER FUNCTIONS =================

function showLoader(text) {
    const loader = document.getElementById('loaderModal');
    document.getElementById('loaderText').innerText = text;
    loader.style.display = 'block';
}

function animateAndRedirect(url, message) {
    const container = document.getElementById('mainContainer');

    if (container) {
        container.classList.add('fade-out');
    }

    showLoader(message);

    setTimeout(() => {
        window.location.href = url;
    }, 900); // smooth delay
}

let bookingToCancel = null;

// Open confirmation modal
function openCancelModal(bookingId) {
    bookingToCancel = bookingId;
    document.getElementById('cancelModal').style.display = 'block';
}

// Close modal without cancelling
function closeCancelModal() {
    bookingToCancel = null;
    document.getElementById('cancelModal').style.display = 'none';
}

// Confirm cancellation
async function confirmCancel() {
    if (!bookingToCancel) return;

    try {
        showLoader("Cancelling booking...");

        const response = await fetch(`/api/cancel/${bookingToCancel}`, {
            method: 'POST'
        });

        const data = await response.json();

        setTimeout(() => {
            document.getElementById('loaderModal').style.display = 'none';

            if (data.success) {
                closeCancelModal();
                loadBookings();
                loadCars();
            } else {
                alert(data.message);
            }
        }, 800);

    } catch (error) {
        document.getElementById('loaderModal').style.display = 'none';
        alert('An error occurred. Please try again.');
    }
}

async function confirmCancel() {
    if (!bookingToCancel) return;

    document.getElementById('cancelModal').style.display = 'none';
    document.getElementById('cancelLoader').style.display = 'block';

    try {
        const response = await fetch(`/api/cancel/${bookingToCancel}`, {
            method: 'POST'
        });

        const data = await response.json();

        setTimeout(() => {
            document.getElementById('cancelLoader').style.display = 'none';

            if (data.success) {
                loadBookings();
                loadCars();
            } else {
                alert(data.message);
            }
        }, 900);

    } catch (error) {
        document.getElementById('cancelLoader').style.display = 'none';
        alert('An error occurred. Please try again.');
    }
}
