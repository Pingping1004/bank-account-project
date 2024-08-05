import express from 'express';
import db from '../db/connection.js';

const router = express.Router(); // Changed to router

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

        // Debug logs
        console.log(`Time passed for ${accountName}: ${timePass} minutes`);

        if (timePass >= 1) {
            interestRate = 0.5;
        } else if (timePass >= 0.5) {
            interestRate = 0.3;
        } else if (timePass >= 0.25) {
            interestRate = 0.2;
        }

        // More debug logs
        console.log(`Interest rate for ${accountName}: ${interestRate * 100}%`);

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
            console.log(`No interest for account: ${accountName}, time passed: ${timePass.toFixed(2)} minutes`);
        }
    }

    return { totalDividendPaid, updatedBalances: updateBalances };
}

setInterval(calculateInterestAndDividend, 60 * 1000); // Every minute

router.put('/update-balances', async (req, res) => {
    try {
        const { totalDividendPaid, updatedBalances } = await calculateInterestAndDividend();
        res.status(200).json({ totalDividendPaid, updatedBalances });
    } catch (error) {
        console.error('Error updating balances:', error);
        res.status(500).json({ error: 'Failed to update balances' });
    }
});

export default router;