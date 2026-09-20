require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Health endpoint
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "ok",
            service: "immxrsive-phase0",
            database: "connected"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            database: "disconnected"
        });
    }
});

// Get all items
app.get("/items", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, title, created_at FROM items ORDER BY id DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not load items"
        });
    }
});

// Add an item
app.post("/items", async (req, res) => {
    try {
        const { title } = req.body;

       if (typeof title !== "string" || title.length === 0) {
    return res.status(400).json({
        error: "Title is required"
    });
}

        const result = await pool.query(
            "INSERT INTO items (title) VALUES ($1) RETURNING *",
            [title]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not add item"
        });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});