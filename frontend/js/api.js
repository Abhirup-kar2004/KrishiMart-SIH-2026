// api.js
// Small shared helpers used on every page.
// Change API_BASE if your backend runs on a different port.

const API_BASE = 'http://localhost:5000/api';

// ---- Save / read the logged-in user from the browser's localStorage ----
function saveUser(user) {
    localStorage.setItem('krishimart_user', JSON.stringify(user));
}

function getUser() {
    const raw = localStorage.getItem('krishimart_user');
    return raw ? JSON.parse(raw) : null;
}

function logoutUser() {
    localStorage.removeItem('krishimart_user');
    localStorage.removeItem('krishimart_cart');
    window.location.href = 'index.html';
}

// ---- Fills the navbar's right-hand links based on login state ----
// Every page has: <div id="nav-links"></div> inside the <nav>
function renderNavLinks() {
    const nav = document.getElementById('nav-links');
    if (!nav) return;

    const user = getUser();

    if (!user) {
        nav.innerHTML = `
            <a href="marketplace.html">Marketplace</a>
            <a href="login.html">Log in</a>
            <a href="register.html">Sign up</a>
        `;
        return;
    }

    let dashboardLink = '';
    if (user.role === 'admin') {
        dashboardLink = `<a href="admin-dashboard.html">Admin Dashboard</a>`;
    } else if (user.role === 'farmer') {
        dashboardLink = `<a href="farmer-dashboard.html">My Dashboard</a>`;
    } else {
        dashboardLink = `<a href="my-orders.html">My Orders</a>`;
    }

    nav.innerHTML = `
        <a href="marketplace.html">Marketplace</a>
        ${dashboardLink}
        <a href="profile.html">Profile</a>
        <span style="margin-left:1.5rem;">Hi, ${user.name.split(' ')[0]}</span>
        <a href="#" onclick="logoutUser(); return false;">Log out</a>
    `;
}

// ---- Redirect helpers used at the top of protected pages ----
function requireLogin() {
    if (!getUser()) {
        window.location.href = 'login.html';
    }
}

function requireRole(role) {
    const user = getUser();
    if (!user || user.role !== role) {
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', renderNavLinks);
