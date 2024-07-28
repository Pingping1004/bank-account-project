import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import bodyParser from 'body-parser'
import authRoutes from './userModel/auth.js';
import transactionRoutes from './transactionModel/transactions.js';

const app = express();
const port = process.env.MYSQL_PORT || 3000;

dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));


app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${port}`)
})

export default app;