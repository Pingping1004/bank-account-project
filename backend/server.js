import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import bodyParser from 'body-parser'
import authRoutes from './userModel/auth.js';
import transactionRoutes from './transactionModel/transactions.js';
import accountRoutes from './accountModel/account.js';
import interestRoutes from './transactionModel/interest.js';

const app = express();
const port = process.env.MYSQL_PORT || 3000;

dotenv.config();

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(cors());
app.use(cors({
    origin: 'https://bank-account-website.netlify.app' // Replace with your frontend domain
  }));
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/interests', interestRoutes);

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${port}`)
})

export default app;