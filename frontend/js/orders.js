// orders.js
// Loads a consumer/buyer's order history and the nearest-farmers list.

document.addEventListener('DOMContentLoaded', () => {
    requireLogin();
    const user = getUser();
    if (user.role === 'farmer') {
        window.location.href = 'farmer-dashboard.html';
        return;
    }
    loadOrders(user.user_id);
    loadNearbyFarmers(user.latitude, user.longitude);
});

async function loadOrders(buyerId) {
    const wrap = document.getElementById('ordersWrap');
    const empty = document.getElementById('emptyOrders');

    try {
        const res = await fetch(`${API_BASE}/orders/buyer/${buyerId}`);
        const orders = await res.json();

        if (orders.length === 0) {
            wrap.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        wrap.innerHTML = orders.map(o => `
            <div class="card" style="margin-bottom:1rem;">
                <div class="card-body">
                    <div class="section-head">
                        <h3>Order #${o.order_id}</h3>
                        <span class="meta">${new Date(o.order_date).toLocaleString()} &middot; Status: ${o.status}</span>
                    </div>
                    <table>
                        <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
                        <tbody>
                            ${o.items.map(i => `
                                <tr><td>${i.product_name}</td><td>${i.quantity} ${i.unit}</td><td>Rs. ${i.price}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="text-align:right; font-weight:600; margin-top:0.5rem;">Total: Rs. ${o.total_amount}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        wrap.innerHTML = '';
        empty.style.display = 'block';
        empty.textContent = 'Could not load orders. Is the backend running?';
    }
}

async function loadNearbyFarmers(lat, lng) {
    const wrap = document.getElementById('nearbyWrap');
    if (!lat || !lng) {
        wrap.innerHTML = '<p class="meta">Add your location in your profile to see nearby farmers.</p>';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/insights/nearby-farmers?lat=${lat}&lng=${lng}`);
        const farmers = await res.json();

        wrap.innerHTML = `
            <table>
                <thead><tr><th>Farmer</th><th>City</th><th>Distance</th></tr></thead>
                <tbody>
                    ${farmers.map(f => `
                        <tr><td>${f.name}</td><td>${f.city || '-'}</td><td>${f.distance_km} km</td></tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        wrap.innerHTML = '<p class="meta">Could not load nearby farmers.</p>';
    }
}
