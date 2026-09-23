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

const user = getUser();
const stateSelect = document.getElementById('state');
const citySelect = document.getElementById('city');
const form = document.getElementById('profileForm');
const msg = document.getElementById('msg');

if (!user) {
    window.location.href = 'login.html';
} else {
    loadProfile();
}

function setCities(selectedCity) {
    const cities = citiesByState[stateSelect.value] || [];
    citySelect.innerHTML = '<option value="">Select your city / district</option>';
    cities.forEach(city => citySelect.appendChild(new Option(city, city)));
    citySelect.disabled = cities.length === 0;
    citySelect.value = selectedCity || '';
}

stateSelect.addEventListener('change', () => setCities(''));

async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE}/auth/profile/${user.user_id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        document.getElementById('name').value = data.name;
        document.getElementById('email').value = data.email;
        document.getElementById('phone').value = data.phone || '';
        stateSelect.value = data.state || '';
        setCities(data.city);
    } catch (error) {
        msg.textContent = error.message || 'Could not load your profile.';
        msg.className = 'form-msg error';
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
        const res = await fetch(`${API_BASE}/auth/profile/${user.user_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                state: stateSelect.value,
                city: citySelect.value
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        saveUser({ ...user, name: document.getElementById('name').value, state: stateSelect.value, city: citySelect.value });
        msg.textContent = data.message;
        msg.className = 'form-msg success';
    } catch (error) {
        msg.textContent = error.message || 'Could not update your profile.';
        msg.className = 'form-msg error';
    }
});
