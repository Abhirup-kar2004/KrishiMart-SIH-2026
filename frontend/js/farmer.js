// farmer.js
// Logic for the farmer dashboard: add product, list own products, view orders, see forecast.

document.addEventListener('DOMContentLoaded', () => {
    requireRole('farmer');
    const user = getUser();
    loadMyProducts(user.user_id);
    loadReceivedOrders(user.user_id);
    loadForecast();

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addProduct(user.user_id);
    });
});

async function loadMyProducts(farmerId) {
    const wrap = document.getElementById('myProductsWrap');
    const statsRow = document.getElementById('statsRow');

    try {
        const res = await fetch(`${API_BASE}/products/farmer/${farmerId}`);
        const products = await res.json();

        statsRow.innerHTML = `
            <div class="stat-box"><div class="num">${products.length}</div><div class="label">Products listed</div></div>
            <div class="stat-box"><div class="num">${products.reduce((s, p) => s + Number(p.quantity), 0).toFixed(0)}</div><div class="label">Total stock (all units)</div></div>
        `;

        if (products.length === 0) {
            wrap.innerHTML = `<div class="empty-state">You haven't listed any products yet. Click "+ Add Product" above.</div>`;
            return;
        }

        wrap.innerHTML = `
            <table>
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.category}</td>
                            <td>Rs. ${p.price} / ${p.unit}</td>
                            <td>${p.quantity} ${p.unit}</td>
                            <td><button class="btn btn-outline" onclick="deleteProduct(${p.product_id}, ${farmerId})">Remove</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        wrap.innerHTML = `<div class="empty-state">Could not load products. Is the backend running?</div>`;
    }
}

async function addProduct(farmerId) {
    const msg = document.getElementById('productMsg');
    const body = {
        farmer_id: farmerId,
        name: document.getElementById('pname').value,
        category: document.getElementById('pcategory').value,
        price: document.getElementById('pprice').value,
        unit: document.getElementById('punit').value,
        quantity: document.getElementById('pquantity').value,
        description: document.getElementById('pdesc').value
    };

    try {
        const res = await fetch(`${API_BASE}/products`, {
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

        msg.textContent = 'Product added!';
        msg.className = 'form-msg success';
        document.getElementById('productForm').reset();
        loadMyProducts(farmerId);
        setTimeout(() => {
            document.getElementById('addProductForm').style.display = 'none';
            msg.textContent = '';
        }, 1000);
    } catch (err) {
        msg.textContent = 'Could not reach the server. Is the backend running?';
        msg.className = 'form-msg error';
    }
}

async function deleteProduct(productId, farmerId) {
    if (!confirm('Remove this product from the marketplace?')) return;
    await fetch(`${API_BASE}/products/${productId}`, { method: 'DELETE' });
    loadMyProducts(farmerId);
}

async function loadReceivedOrders(farmerId) {
    const wrap = document.getElementById('receivedOrdersWrap');
    try {
        const res = await fetch(`${API_BASE}/orders/farmer/${farmerId}`);
        const rows = await res.json();

        if (rows.length === 0) {
            wrap.innerHTML = `<div class="empty-state">No orders yet for your products.</div>`;
            return;
        }

        wrap.innerHTML = `
            <table>
                <thead><tr><th>Product</th><th>Buyer</th><th>Qty</th><th>Price</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td>${r.product_name}</td>
                            <td>${r.buyer_name}</td>
                            <td>${r.quantity}</td>
                            <td>Rs. ${r.price}</td>
                            <td>${new Date(r.order_date).toLocaleDateString()}</td>
                            <td>${r.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        wrap.innerHTML = `<div class="empty-state">Could not load orders.</div>`;
    }
}

async function loadForecast() {
    const wrap = document.getElementById('forecastWrap');
    try {
        const res = await fetch(`${API_BASE}/insights/demand-forecast`);
        const rows = await res.json();

        wrap.innerHTML = `
            <table>
                <thead><tr><th>Product</th><th>Total sold so far</th><th>Times ordered</th><th>Predicted demand / order</th></tr></thead>
                <tbody>
                    ${rows.map(r => `
                        <tr>
                            <td>${r.name}</td>
                            <td>${r.total_sold}</td>
                            <td>${r.times_ordered}</td>
                            <td>${r.predicted_next_demand}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        wrap.innerHTML = `<div class="empty-state">Could not load forecast.</div>`;
    }
}
