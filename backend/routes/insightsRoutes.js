// insightsRoutes.js
// These two endpoints demonstrate the "AI for demand forecasting and route
// optimization" part of the problem statement, using SIMPLE, easy-to-explain
// logic (no heavy ML libraries needed) - perfect for a beginner project demo.

const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ---------- DEMAND FORECAST ----------
// GET /api/insights/demand-forecast
// Logic: for every product, look at how many units were ordered in the past
// orders and take the AVERAGE quantity per order. We treat that average as
// the "predicted demand" for the next order cycle. This is a simple moving
// average forecast - the same basic idea real demand-forecasting AI tools
// build on top of.
router.get('/demand-forecast', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.product_id, p.name, p.category, p.quantity AS stock_left,
                   COALESCE(SUM(oi.quantity), 0) AS total_sold,
                   COALESCE(COUNT(oi.order_item_id), 0) AS times_ordered,
                   ROUND(COALESCE(AVG(oi.quantity), 0), 2) AS predicted_next_demand
            FROM products p
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.product_id
            ORDER BY total_sold DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while generating forecast.' });
    }
});

// ---------- ROUTE OPTIMIZATION (nearest-farmer-first) ----------
// GET /api/insights/nearby-farmers?lat=22.57&lng=88.36
// Logic: we calculate straight-line distance (Haversine formula) between the
// buyer's location and every farmer, then sort farmers nearest-first. A
// delivery van visiting farmers in this order travels the shortest overall
// path - a simple, explainable version of route optimization.
router.get('/nearby-farmers', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ message: 'lat and lng are required.' });
        }

        const [farmers] = await db.query(
            `SELECT user_id, name, city, latitude, longitude FROM users
             WHERE role = 'farmer' AND latitude IS NOT NULL AND longitude IS NOT NULL`
        );

        const withDistance = farmers.map(f => ({
            ...f,
            distance_km: haversineDistance(lat, lng, f.latitude, f.longitude)
        }));

        withDistance.sort((a, b) => a.distance_km - b.distance_km);

        res.json(withDistance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while calculating route.' });
    }
});

// Haversine formula: standard way to find distance between two lat/lng points on Earth
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // rounded to 1 decimal place
}

module.exports = router;
