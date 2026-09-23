// server.js
// This is the entry point of the backend. Run it with: node server.js

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const insightsRoutes = require('./routes/insightsRoutes');

const app = express();
const PORT = 5000;

app.use(cors());            // allows the frontend (opened as a file/live-server) to call this API
app.use(express.json());    // lets us read JSON sent from the frontend

// Route groups
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/insights', insightsRoutes);

app.get('/', (req, res) => {
    res.send('KrishiMart backend is running. Try /api/products');
});

app.listen(PORT, () => {
    console.log(`KrishiMart server running at http://localhost:${PORT}`);
});
