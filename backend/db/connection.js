import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.MYSQL_HOSTNAME,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT,
});

console.log('MYSQL_HOSTNAME:', process.env.MYSQL_HOSTNAME);
console.log('MYSQL_USERNAME:', process.env.MYSQL_USERNAME);
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD);
console.log('MYSQL_DB:', process.env.MYSQL_DB);
console.log('MYSQL_PORT:', process.env.MYSQL_PORT);

//verify connection between backend server and database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        throw err;
    }
    console.log('Connect to database successfully!');
});

export default db;