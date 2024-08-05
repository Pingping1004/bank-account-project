import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/connection.js';

// const app = express();
const router = express.Router(); // Changed to router

// Signup endpoint
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO user (username, password) VALUES (?, ?)';

        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error executing MySQL query:', err);
                res.status(500).json({ error: 'Failed to signup user' });
            } else {
                res.status(200).json({ message: 'User signed up successfully' });
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ error: 'Failed to signup user' });
    }
});

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT * FROM user WHERE username = ?`;
    db.query(sql, [username], async (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Failed to authenticate user' });
        } else {
            if (result.length > 0) {
                const user = result[0];
                try {
                    const match = await bcrypt.compare(password, user.password);
                    if (match) {
                        const userId = user.id;
                        res.status(200).json({ message: 'User authenticated successfully', user_id: userId });
                    } else {
                        res.status(401).json({ error: 'Invalid username or password' });
                    }
                } catch (error) {
                    console.error('Error comparing password:', error);
                    res.status(500).json({ error: 'Failed to authenticate user' });
                }
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        };
    });
});

export default router;