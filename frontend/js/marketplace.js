// marketplace.js
// Frontend-only KrishiMart marketplace
// No Node.js / backend required

const products = [
    {
        product_id: 1,
        name: "Tomato",
        category: "Vegetable",
        price: 18,
        unit: "kg",
        quantity: 200,
        farmer_name: "Ramesh Kumar",
        farmer_city: "Nadia",
        farmer_id: 1,
        image_url: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=500&q=80"
    },
    {
        product_id: 2,
        name: "Potato",
        category: "Vegetable",
        price: 15,
        unit: "kg",
        quantity: 500,
        farmer_name: "Ramesh Kumar",
        farmer_city: "Nadia",
        farmer_id: 1,
        image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80"
    },
    {
        product_id: 3,
        name: "Rice (Basmati)",
        category: "Grain",
        price: 55,
        unit: "kg",
        quantity: 1000,
        farmer_name: "Sita Devi",
        farmer_city: "Bardhaman",
        farmer_id: 2,
        image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80"
    },
    {
        product_id: 4,
        name: "Mustard Oil",
        category: "Oil",
        price: 140,
        unit: "litre",
        quantity: 100,
        farmer_name: "Sita Devi",
        farmer_city: "Bardhaman",
        farmer_id: 2,
        image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    updateCartCount();
});

function loadProducts() {

    const grid = document.getElementById("productGrid");
    const empty = document.getElementById("emptyState");

    const search = document
        .getElementById("search")
        .value
        .trim()
        .toLowerCase();

    const category = document.getElementById("category").value;

    let filteredProducts = products.filter(product => {

        const matchesSearch =
            product.name.toLowerCase().includes(search);

        const matchesCategory =
            category === "" ||
            product.category === category;

        return matchesSearch && matchesCategory;
    });

    if (filteredProducts.length === 0) {

        grid.innerHTML = "";

        empty.style.display = "block";

        empty.textContent =
            "No products found. Try a different search.";

        return;
    }

    empty.style.display = "none";

    grid.innerHTML = filteredProducts.map(product => {

        return `
            <div class="card">

                <img 
                    src="${product.image_url}" 
                    alt="${product.name}"
                    style="width:100%; height:200px; object-fit:cover;"
                >

                <div class="card-body">

                    <h3>${product.name}</h3>

                    <p class="meta">
                        ${product.category}
                        &middot;
                        Sold by ${product.farmer_name}
                        (${product.farmer_city})
                    </p>

                    <p class="price">
                        Rs. ${product.price} / ${product.unit}
                    </p>

                    <p class="meta">
                        ${product.quantity} ${product.unit} available
                    </p>

                    <button
                        class="btn btn-primary"
                        onclick="addToCart(
                            ${product.product_id},
                            '${escapeQuotes(product.name)}',
                            ${product.price},
                            '${product.unit}',
                            ${product.farmer_id}
                        )">
                        Add to Cart
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


// ---------------- CART ----------------

function getCart() {

    const raw =
        localStorage.getItem("krishimart_cart");

    return raw ? JSON.parse(raw) : [];
}


function saveCart(cart) {

    localStorage.setItem(
        "krishimart_cart",
        JSON.stringify(cart)
    );

    updateCartCount();
}


function addToCart(
    product_id,
    name,
    price,
    unit,
    farmer_id
) {

    const cart = getCart();

    const existing =
        cart.find(item =>
            item.product_id === product_id
        );

    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            product_id: product_id,
            name: name,
            price: price,
            unit: unit,
            farmer_id: farmer_id,
            quantity: 1
        });

    }

    saveCart(cart);

    alert(name + " added to cart.");
}


function updateCartCount() {

    const el =
        document.getElementById("cartCount");

    if (!el) return;

    const cart = getCart();

    const count =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    el.textContent = count;
}


function escapeQuotes(str) {

    return str.replace(/'/g, "\\'");
}