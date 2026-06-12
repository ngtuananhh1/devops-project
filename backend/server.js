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

// In-memory fallback used during tests or when Postgres is unavailable
const fakeDb = { todos: [], nextId: 1 };

// runtime flag: when true, use fakeDb instead of Postgres
let useFakeDb = false;

const fakeQuery = async (text, params) => {
    const t = text.trim();
    if (/^CREATE TABLE/i.test(t)) {
        return { rows: [] };
    }
    if (/^SELECT \* FROM todos/i.test(t)) {
        const rows = fakeDb.todos.slice().sort((a, b) => a.id - b.id);
        return { rows };
    }
    if (/INSERT INTO todos/i.test(t)) {
        const title = params[0];
        const completed = params[1];
        const newTodo = { id: fakeDb.nextId++, title, completed };
        fakeDb.todos.push(newTodo);
        return { rows: [newTodo] };
    }
    if (/DELETE FROM todos/i.test(t)) {
        const id = Number(params[0]);
        const idx = fakeDb.todos.findIndex(x => x.id === id);
        if (idx === -1) return { rows: [] };
        const removed = fakeDb.todos.splice(idx, 1);
        return { rows: removed };
    }
    if (/UPDATE todos/i.test(t)) {
        const safeTitle = params[0];
        const safeCompleted = params[1];
        const id = Number(params[2]);
        const todo = fakeDb.todos.find(x => x.id === id);
        if (!todo) return { rows: [] };
        if (safeTitle !== null) todo.title = safeTitle;
        if (safeCompleted !== null) todo.completed = safeCompleted;
        return { rows: [todo] };
    }
    return { rows: [] };
};

const db = {
    query: async (text, params) => {
        if (useFakeDb || process.env.NODE_ENV === 'test' || process.env.USE_FAKE_DB === 'true') {
            return fakeQuery(text, params || []);
        }
        try {
            return await pool.query(text, params);
        } catch (err) {
            console.warn('Postgres query failed, switching to in-memory DB:', err.message || err);
            useFakeDb = true;
            return fakeQuery(text, params || []);
        }
    }
};

// Try a quick connection test and enable fake DB if Postgres is unreachable
pool.query('SELECT 1').then(() => {
    console.log('Connected to Postgres');
}).catch((err) => {
    console.warn('Could not connect to Postgres, using in-memory DB. Error:', err.message || err);
    useFakeDb = true;
});

// Ensure the todos table exists (or noop when using fake DB)
db.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT false
  );
`).then(() => console.log("Table 'todos' is ready!"))
  .catch(err => console.error(err));
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0'
    });
});

// GET all todos
app.get('/api/todos', async (req, res) => {
    try {
        const result = await db.query(
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

        const result = await db.query(
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

        const result = await db.query(
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

        const result = await db.query(
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