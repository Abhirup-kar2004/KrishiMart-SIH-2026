# KrishiMart

A simple digital marketplace that connects farmers directly with consumers and
bulk buyers — built for the problem statement *"Multiple intermediaries reduce
farmers' earnings and increase consumer prices"* (Ministry of Consumer Affairs,
Food & Public Distribution).

Think of it like three separate counters in one shop: a **farmer's counter**
(list produce), a **buyer's counter** (browse and order), and a small
**insights corner** (simple demand forecast + nearest-farmer distances) —
all talking to one shared MySQL "ledger" in the back room.

## Tech stack
- **Frontend:** plain HTML, CSS, JavaScript (no framework, no build step)
- **Backend:** Python + Flask (a small set of API routes)
- **Database:** MySQL

## Folder structure
```
krishimart/
├── database/
│   └── schema.sql          <- run this first to create the database & tables
├── backend/
│   ├── app.py               <- starts the Flask API server
│   ├── requirements.txt     <- Python dependencies
│   ├── config/db.js         <- MySQL connection settings
│   └── routes/               <- one file per feature (auth, products, orders, insights)
└── frontend/
    ├── index.html, login.html, register.html, marketplace.html,
    │   cart.html, my-orders.html, farmer-dashboard.html
    ├── css/style.css
    └── js/                   <- one small JS file per page
```

## How to run it (step by step)

### 1. Create the database
1. Open MySQL (Workbench, phpMyAdmin, or the `mysql` command line).
2. Run the entire `database/schema.sql` file. This creates the `krishimart`
   database, all 4 tables, and a few sample farmers/products/consumers so the
   app isn't empty on first run.

### 2. Start the backend
```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```
The backend defaults to MySQL user `root` with an empty password. If your
MySQL installation uses a password, set these PowerShell variables before
starting Flask:
```
$env:MYSQL_USER = "root"
$env:MYSQL_PASSWORD = "your-mysql-password"
$env:MYSQL_DATABASE = "krishimart"
python app.py
```

If you already created the database using an older version of the schema, run
this once before starting the backend:
```
ALTER TABLE users ADD COLUMN state VARCHAR(100) AFTER address;
ALTER TABLE users MODIFY role ENUM('farmer', 'consumer', 'buyer', 'admin') NOT NULL;
```

To create an administrator account, run this in MySQL after creating the
database:
```
INSERT INTO users (name, email, password, role, state, city)
VALUES ('Administrator', 'admin@krishimart.com', 'change-this-password', 'admin', 'West Bengal', 'Kolkata');
```
Change the example password before using the account.

```
python app.py
```
The API runs at `http://localhost:5000`.

### 3. Open the frontend
Just double-click `frontend/index.html` to open it in your browser — or, for
a smoother experience, right-click it in VS Code and choose **"Open with Live
Server"**. No build step, no npm install needed on the frontend side.

### 4. Try it out
- Demo accounts (password `123456` for all):
  - Farmer: `ramesh@krishimart.com`
  - Consumer: `anjali@krishimart.com`
  - Bulk buyer: `buyer@krishimart.com`
- Log in as the farmer to add a product, then log out and log in as the
  consumer to browse the marketplace, add it to cart, and place an order.
- Log back in as the farmer to see the order under **Orders Received**, and
  check **Demand Forecast** at the bottom of the dashboard.

## How each requirement from the problem statement is covered

| Requirement | Where it lives |
|---|---|
| Connects farmers/FPOs directly with consumers and bulk buyers | `register.html` (3 account types) + `marketplace.html` (buy directly from a farmer's listing, no middleman) |
| Logistics support | `my-orders.html` → "Nearest Farmers" table, using each user's saved location |
| AI for demand forecasting | `/api/insights/demand-forecast` — a simple moving-average of past orders per product, shown on the farmer dashboard |
| AI for route optimization | `/api/insights/nearby-farmers` — Haversine distance formula sorts farmers nearest-first, a simple explainable stand-in for route optimization |
| Better prices for farmers / lower prices for consumers | No commission layer — farmers set their own price, buyers pay that price directly |

## Notes for your submission / viva
- Passwords are stored in plain text here for simplicity. If asked in a viva,
  mention that a real system would use password hashing (e.g. `bcrypt`).
- The "AI" features are intentionally simple (average and distance formulas)
  so you can explain the exact logic line by line — this is normal and
  expected for a beginner/academic project; you can always mention it as a
  "first version" that could later use a real ML model (e.g. time-series
  forecasting for demand, or a proper route-optimization algorithm like
  nearest-neighbour/TSP for logistics).
