import express from 'express';
import db from '../db/connection.js';

const router = express.Router(); // Changed to router

router.post('/', async (req, res) => {
    const { user_id, name } = req.body;
    console.log('POST /api/accounts', req.body);
    
    if (!user_id || !name) {
        console.log('Missing required account data');
        return res.status(400).json({ error: 'Missing required account data' });
    }
    
    const sql = 'INSERT INTO accounts (user_id, name) VALUES(?, ?)'
    try {
        const [result] = await db.promise().query(sql, [user_id, name]);
        res.status(201).json({ accountId: result.insertId, user_id, name });
    } catch (error) {
        console.error('Error inserting transaction: ', error);
        res.status(500).json({ error: 'Failed to insert account' });
    }
});

router.get('/', (req, res) => {
    const { user_id } = req.query;
    console.log('GET /api/accounts', req.query);
    const sql = 'SELECT id, name FROM accounts WHERE user_id = ?';
    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to retrieve accounts' });
        } else {
            res.status(200).json(result);
        }
    });
})

router.delete('/:accountId', (req, res) => {
    const { accountId } = req.params;
    console.log('DELETE /api/accounts', req.params);

    if (!accountId) {
        return res.status(400).json({ error: 'Missing accountId parameter' });
    }

    const sql = 'DELETE FROM accounts WHERE id = ?';
    db.query(sql, [accountId], (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to delete accounts' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Account not found' });
        } else {
            res.status(200).json(result);
        }
    })
})

export default router;