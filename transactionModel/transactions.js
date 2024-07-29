import express from 'express';
import db from '../db/connection.js';

// const app = express();
const router = express.Router(); // Changed to router

function formatMySQLDatetime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Store transaction endpoint
router.post('/', async (req, res) => {
    const { user_id, name, amount, type, date, balance } = req.body;
    console.log('Received transaction data:', req.body);

    if (!user_id || !name || !amount || !type || !date) {
        console.log('Missing required transaction data');
        return res.status(400).json({ error: 'Missing required transaction data' });
    }

    const formattedDate = formatMySQLDatetime(date);
    const sql = 'INSERT INTO transactions (user_id, name, amount, type, date, balance) VALUES (?, ?, ?, ?, ?, ?)';
    try {
        const [result] = await db.promise().query(sql, [user_id, name, amount, type, formattedDate, balance]);
        res.status(201).json({ message: 'Transaction stored successfully', transactionId: result.insertId });
    }
    catch (error) {
        console.error('Error inserting transaction: ', error);
        res.status(500).json({ error: 'Failed to insert transaction' });
    }
});

// Retrieve transactions endpoint
router.get('/', (req, res) => {
    const { user_id } = req.query;
    console.log('GET /api/transactions', req.query);

    if (!user_id) {
        return res.status(400).json({ error: 'Missing user_id parameter' });
    }

    const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC';
    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to retrieve transactions' });
        } else {
            res.status(200).json(result);
        }
    });
});

router.put('/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const { amount, type, date, balance } = req.body;
    console.log('PUT /api/transactions', req.params);
    console.log('Request Body:', req.body);

    // Validate request data
    if (!amount || !type || !date || balance === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure balance is a number
    const balanceNumber = parseFloat(balance);

    console.log('Received balance type:', typeof balance);
    const sql = 'UPDATE transactions SET amount = ?, type = ?, date = ?, balance = ? WHERE id = ?';
    const values = [amount, type, date, balanceNumber, transactionId];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to update transactions' });
        } else if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        } else {
            res.status(200).json(result);
        }
    });
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    console.log('DELETE /api/transactions', req.query);

    const sql = 'DELETE * FROM transactions WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to delete transactions' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Transaction not found' });
        } else {
            res.status(200).json({ message: 'Transaction deleted successfully' });
        }
    });
});

export default router;