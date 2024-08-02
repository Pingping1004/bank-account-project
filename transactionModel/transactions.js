import express from 'express';
import db from '../db/connection.js';

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
    const { user_id, name, amount, lending, type, date, balance } = req.body;
    console.log('Received transaction data:', req.body);

    if (!user_id || !name || !amount || !type || !date) {
        console.log('Missing required transaction data');
        return res.status(400).json({ error: 'Missing required transaction data' });
    }

    const formattedDate = formatMySQLDatetime(date);
    const sql = 'INSERT INTO transactions (user_id, name, amount, lending, type, date, balance) VALUES (?, ?, ?, ?, ?, ?, ?)';
    try {
        const [result] = await db.promise().query(sql, [user_id, name, amount, lending, type, formattedDate, balance]);
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
    const { amount, lending, type, date, balance } = req.body;
    console.log('PUT /api/transactions', req.params);
    console.log('Request Body:', req.body);

    // Validate request data
    if (!amount || !type || !date || balance === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure balance is a number
    const balanceNumber = parseFloat(balance);

    console.log('Received balance type:', typeof balanceNumber);
    const sql = 'UPDATE transactions SET amount = ?, lending = ?, type = ?, date = ?, balance = ? WHERE id = ?';
    const values = [amount, lending, type, date, balanceNumber, transactionId];

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

router.delete('/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    console.log('DELETE /api/transactions', req.params);

    // Ensure transactionId is provided
    if (!transactionId) {
        return res.status(400).json({ error: 'Missing transactionId parameter' });
    }

    const sql = 'DELETE FROM transactions WHERE id = ?';
    const values = [transactionId];

    db.query(sql, values, (err, result) => {
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

async function calculateInterestAndDividend() {
    let totalDividendPaid = 0;
    // Fetch distinct account names
    const [transactions] = await db.promise().query('SELECT DISTINCT name FROM transactions');
    const currentTime = new Date();
    const updateBalances = [];

    for (const account of transactions) {
        const accountName = account.name;

        if (accountName === 'Admin') {
            console.log(`Skipping Admin account: ${accountName}`);
            continue;
        }

        // Fetch the latest balance and last transaction date
        let [balanceResult] = await db.promise().query('SELECT balance, date FROM transactions WHERE name = ? ORDER BY date DESC LIMIT 1', [accountName]);
        if (balanceResult.length === 0) {
            console.log(`No transactions found for account: ${accountName}`);
            continue;
        }

        let balance = parseFloat(balanceResult[0].balance);
        let transactionTime = new Date(balanceResult[0].date); // Fetching the last transaction date

        let timePass = (currentTime - transactionTime) / (1000 * 60); // Time passed in minutes
        let interestRate = 0;

        if (timePass >= 1) {
            interestRate = 0.5;
        } else if (timePass >= 0.5) {
            interestRate = 0.3;
        } else if (timePass >= 0.25) {
            interestRate = 0.2;
        }

        if (interestRate > 0) {
            const interest = parseFloat((balance * interestRate).toFixed(2));
            console.log(`Calculating interest for account: ${accountName}:`);
            console.log(`Before ${balance}`);
            console.log(`Interest: ${interest}`);

            balance += interest;
            balance = parseFloat(balance.toFixed(2));
            console.log(`After ${balance}`);

            totalDividendPaid += interest;
            totalDividendPaid = parseFloat(totalDividendPaid.toFixed(2));
            console.log('Total dividend paid: ' + totalDividendPaid.toFixed(2));

            // Update the balance and last transaction date
            await db.promise().query('UPDATE transactions SET balance = ?, date = ? WHERE name = ?', [balance, currentTime, accountName]);
            updateBalances.push({ name: accountName, balance });
        } else {
            console.log(`No interest for account: ${accountName}, time passed: ${timePass} minutes`);
        }
    }

    return { totalDividendPaid, updatedBalances: updateBalances };
}

setInterval(calculateInterestAndDividend, 60 * 1000); // Every minute

// Inside your Express.js router
router.post('/update-balances', async (req, res) => {
    try {
        const { totalDividendPaid, updatedBalances } = await calculateInterestAndDividend();
        res.status(200).json({ totalDividendPaid, updatedBalances });
    } catch (error) {
        console.error('Error updating balances:', error);
        res.status(500).json({ error: 'Failed to update balances' });
    }
});

export default router;