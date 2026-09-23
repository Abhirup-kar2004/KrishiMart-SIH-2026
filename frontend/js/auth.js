// auth.js
// Logic for register.html and login.html forms.

const citiesByState = {
    'Andhra Pradesh': ['Guntur', 'Kurnool', 'Vijayawada', 'Visakhapatnam'],
    Bihar: ['Gaya', 'Muzaffarpur', 'Patna'],
    Delhi: ['New Delhi'],
    Gujarat: ['Ahmedabad', 'Rajkot', 'Surat', 'Vadodara'],
    Haryana: ['Hisar', 'Karnal', 'Panipat'],
    Jharkhand: ['Bokaro', 'Dhanbad', 'Ranchi'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Shivamogga'],
    Kerala: ['Kochi', 'Kozhikode', 'Thiruvananthapuram'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur'],
    Maharashtra: ['Mumbai', 'Nagpur', 'Nashik', 'Pune'],
    Odisha: ['Bhubaneswar', 'Cuttack', 'Puri'],
    Punjab: ['Amritsar', 'Ludhiana', 'Patiala'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
    Telangana: ['Hyderabad', 'Karimnagar', 'Warangal'],
    'Uttar Pradesh': ['Agra', 'Kanpur', 'Lucknow', 'Varanasi'],
    Uttarakhand: ['Dehradun', 'Haridwar', 'Nainital'],
    'West Bengal': ['Bardhaman', 'Kolkata', 'Nadia', 'Siliguri']
};

const stateSelect = document.getElementById('state');
const citySelect = document.getElementById('city');
if (stateSelect && citySelect) {
    stateSelect.addEventListener('change', () => {
        const cities = citiesByState[stateSelect.value] || [];
        citySelect.innerHTML = '<option value="">Select your city / district</option>';
        cities.forEach(city => citySelect.appendChild(new Option(city, city)));
        citySelect.disabled = cities.length === 0;
    });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const msg = document.getElementById('msg');
        msg.textContent = '';

        const body = {
            role: document.getElementById('role').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            phone: document.getElementById('phone').value,
            state: document.getElementById('state').value,
            city: document.getElementById('city').value
        };

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                msg.textContent = data.message;
                msg.className = 'form-msg error';
                return;
            }

            msg.textContent = 'Account created! Redirecting to login...';
            msg.className = 'form-msg success';
            setTimeout(() => window.location.href = 'login.html', 1200);
        } catch (err) {
            msg.textContent = 'Could not reach the server. Is the backend running?';
            msg.className = 'form-msg error';
        }
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const msg = document.getElementById('msg');
        msg.textContent = '';

        const body = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                msg.textContent = data.message;
                msg.className = 'form-msg error';
                return;
            }

            saveUser(data.user);
            msg.textContent = 'Login successful! Redirecting...';
            msg.className = 'form-msg success';

            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (data.user.role === 'farmer') {
                    window.location.href = 'farmer-dashboard.html';
                } else {
                    window.location.href = 'marketplace.html';
                }
            }, 800);
        } catch (err) {
            msg.textContent = 'Could not reach the server. Is the backend running?';
            msg.className = 'form-msg error';
        }
    });
}
