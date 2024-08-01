import express from 'express';
import db from '../db/connection.js';

const router = express.Router(); // Changed to router

router.post('/', async (req, res) => {
    const { user_id, name } = req.body;
    console.log('POST /api/accounts', req.body);
    const sql = 'INSERT INTO transactions (user_id, name) VALUES(?, ?)'

    if (!user_id, !name) {
        console.log('Missing required account data');
        return res.status(400).json({ error: 'Missing required account data' });
    }

    try {
        const [result] = await db.promise().query(sql, [user_id, name]);
        res.status(201).json({ message: 'Account stored successfully', accountId: result.user_id, accountName: result.name });
    } catch (error) {
        console.error('Error inserting transaction: ', error);
        res.status(500).json({ error: 'Failed to insert account' });
    }
});

router.get('/', (req, res) => {
    const { user_id, name } = req.query;
    console.log('GET /api/accounts', req.query);
    const sql = 'SELECT name FROM transactions WHERE user_id = ?';
    db.query(sql, [user_id, name], (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to retrieve accounts' });
        } else {
            res.status(200).json(result);
        }
    });
})

router.delete('/:accountId', (req, res) => {
    const { user_id, name } = req.params;
    console.log('DELETE /api/accounts', req.params);

    if (!accountId) {
        return res.status(400).json({ error: 'Missing accountId parameter' });
    }

    const sql = 'DELETE name FROM transactions WHERE user_id = ?';
    db.query(sql, [user_id, name], (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to delete accounts' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Transaction not found' });
        } else {
            res.status(200).json(result);
        }
    })
})

export default router;