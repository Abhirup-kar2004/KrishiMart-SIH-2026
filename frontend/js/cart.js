// cart.js
// Shows the cart (from localStorage) and sends the order to the backend.
// ---------- Cart storage functions ----------

function getCart() {
    const raw = localStorage.getItem('krishimart_cart');
    return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
    localStorage.setItem('krishimart_cart', JSON.stringify(cart));
}
document.addEventListener('DOMContentLoaded', renderCart);

function renderCart() {
    const cart = getCart();
    const wrap = document.getElementById('cartTableWrap');
    const empty = document.getElementById('emptyCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cart.length === 0) {
        wrap.innerHTML = '';
        empty.style.display = 'block';
        checkoutBtn.style.display = 'none';
        document.getElementById('cartTotal').textContent = '0';
        return;
    }

    empty.style.display = 'none';
    checkoutBtn.style.display = 'inline-block';

    let total = 0;
    const rows = cart.map((item, index) => {
        const lineTotal = item.price * item.quantity;
        total += lineTotal;
        return `
            <tr>
                <td>${item.name}</td>
                <td>Rs. ${item.price} / ${item.unit}</td>
                <td>
                    <input type="number" min="1" value="${item.quantity}"
                        style="width:70px;" onchange="updateQuantity(${index}, this.value)">
                </td>
                <td>Rs. ${lineTotal.toFixed(2)}</td>
                <td><button class="btn btn-outline" onclick="removeItem(${index})">Remove</button></td>
            </tr>
        `;
    }).join('');

    wrap.innerHTML = `
        <table>
            <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

function updateQuantity(index, value) {
    const cart = getCart();
    const qty = parseFloat(value);
    cart[index].quantity = qty > 0 ? qty : 1;
    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

async function checkout() {
    const user = getUser();
    const msg = document.getElementById('msg');

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const cart = getCart();
    if (cart.length === 0) return;

    const items = cart.map(i => ({
        product_id: i.product_id,
        farmer_id: i.farmer_id,
        quantity: i.quantity,
        price: i.price
    }));

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buyer_id: user.user_id, items })
        });
        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.message;
            msg.className = 'form-msg error';
            return;
        }

        localStorage.removeItem('krishimart_cart');
        msg.textContent = `Order #${data.order_id} placed successfully!`;
        msg.className = 'form-msg success';
        setTimeout(() => window.location.href = 'my-orders.html', 1200);
    } catch (err) {
        msg.textContent = 'Could not reach the server. Is the backend running?';
        msg.className = 'form-msg error';
    }
    // cart.js
// Shows the cart from localStorage and sends the order to the backend.

function getCart() {
    const raw = localStorage.getItem('krishimart_cart');
    return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
    localStorage.setItem('krishimart_cart', JSON.stringify(cart));
}

document.addEventListener('DOMContentLoaded', renderCart);

function renderCart() {
    const cart = getCart();
    const wrap = document.getElementById('cartTableWrap');
    const empty = document.getElementById('emptyCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cart.length === 0) {
        wrap.innerHTML = '';
        empty.style.display = 'block';
        checkoutBtn.style.display = 'none';
        document.getElementById('cartTotal').textContent = '0';
        return;
    }

    empty.style.display = 'none';
    checkoutBtn.style.display = 'inline-block';

    let total = 0;

    const rows = cart.map((item, index) => {
        const lineTotal = item.price * item.quantity;
        total += lineTotal;

        return `
            <tr>
                <td>
                    <strong>${item.name}</strong>
                </td>

                <td>
                    Rs. ${item.price} / ${item.unit}
                </td>

                <td>
                    <input 
                        type="number"
                        min="1"
                        value="${item.quantity}"
                        style="width:70px;"
                        onchange="updateQuantity(${index}, this.value)"
                    >
                </td>

                <td>
                    Rs. ${lineTotal.toFixed(2)}
                </td>

                <td>
                    <button 
                        class="btn btn-outline"
                        onclick="removeItem(${index})">
                        Remove
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>
        </table>
    `;

    document.getElementById('cartTotal').textContent =
        total.toFixed(2);
}

function updateQuantity(index, value) {
    const cart = getCart();

    const qty = parseFloat(value);

    cart[index].quantity = qty > 0 ? qty : 1;

    saveCart(cart);

    renderCart();
}

function removeItem(index) {
    const cart = getCart();

    cart.splice(index, 1);

    saveCart(cart);

    renderCart();
}
}
