const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy checked',
        version: '1.0.0'
    });
});

// GET all todos
app.get('/api/todos', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM todos ORDER BY id'
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('GET TODOS ERROR:', err);
        res.status(500).json({
            error: err.message
        });
    }
});

// CREATE todo
app.post('/api/todos', async (req, res) => {
    try {
        const { title, completed = false } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({
                error: 'Title cannot be empty'
            });
        }

        const result = await pool.query(
            'INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *',
            [title.trim(), completed]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('POST TODO ERROR:', err);
        res.status(500).json({
            error: err.message
        });
    }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Todo not found'
            });
        }

        res.status(200).json({
            message: 'Todo deleted successfully'
        });

    } catch (err) {
        console.error('DELETE TODO ERROR:', err);
        res.status(500).json({
            error: err.message
        });
    }
});

// UPDATE todo
app.put('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, completed } = req.body;

        const safeTitle =
            title !== undefined ? title : null;

        const safeCompleted =
            completed !== undefined ? completed : null;

        const result = await pool.query(
            `
            UPDATE todos
            SET
                title = COALESCE($1, title),
                completed = COALESCE($2, completed)
            WHERE id = $3
            RETURNING *
            `,
            [safeTitle, safeCompleted, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Todo not found'
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('UPDATE TODO ERROR:', err);
        res.status(500).json({
            error: err.message
        });
    }
});

const port = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Backend running on port ${port}`);
    });
}

module.exports = app;