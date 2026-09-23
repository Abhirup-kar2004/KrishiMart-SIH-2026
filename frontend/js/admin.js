const user = getUser();
const message = document.getElementById('adminMsg');

if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
} else {
    loadAdminDashboard();
}

async function getAdminData(path) {
    const response = await fetch(`${API_BASE}/admin/${path}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not load admin data.');
    return data;
}

async function loadAdminDashboard() {
    try {
        const [summary, users, products, orders] = await Promise.all([
            getAdminData('summary'),
            getAdminData('users'),
            getAdminData('products'),
            getAdminData('orders')
        ]);

        document.getElementById('summary').innerHTML = `
            <div class="stat-box"><div class="num">${summary.users}</div><div class="label">Users</div></div>
            <div class="stat-box"><div class="num">${summary.products}</div><div class="label">Products</div></div>
            <div class="stat-box"><div class="num">${summary.orders}</div><div class="label">Orders</div></div>
        `;
        document.getElementById('usersWrap').innerHTML = userTable(users);
        document.getElementById('productsWrap').innerHTML = productTable(products);
        document.getElementById('ordersWrap').innerHTML = orderTable(orders);
    } catch (error) {
        message.textContent = error.message;
        message.className = 'form-msg error';
    }
}

function userTable(users) {
    return `<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>State</th><th>City</th></tr></thead><tbody>
        ${users.map(item => `<tr><td>${item.name}</td><td>${item.email}</td><td>${item.role}</td><td>${item.state || '-'}</td><td>${item.city || '-'}</td></tr>`).join('')}
    </tbody></table>`;
}

function productTable(products) {
    return `<table><thead><tr><th>Product</th><th>Farmer</th><th>Price</th><th>Stock</th></tr></thead><tbody>
        ${products.map(item => `<tr><td>${item.name}</td><td>${item.farmer_name}</td><td>Rs. ${item.price} / ${item.unit}</td><td>${item.quantity}</td></tr>`).join('')}
    </tbody></table>`;
}

function orderTable(orders) {
    return `<table><thead><tr><th>Order</th><th>Buyer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>
        ${orders.map(item => `<tr><td>#${item.order_id}</td><td>${item.buyer_name}</td><td>Rs. ${item.total_amount}</td><td>${item.status}</td><td>${new Date(item.order_date).toLocaleString()}</td></tr>`).join('')}
    </tbody></table>`;
}
