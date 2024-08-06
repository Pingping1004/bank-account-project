import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// const db = mysql.createConnection({
//     host: process.env.MYSQL_HOSTNAME,
//     user: process.env.MYSQL_USERNAME,
//     password: process.env.MYSQL_PASSWORD,
//     database: process.env.MYSQL_DB,
//     port: process.env.MYSQL_PORT,
// });

const db = mysql.createConnection({
    host: functions.config().db.host,
    user: functions.config().db.user,
    password: functions.config().db.password,
    database: functions.config().db.name,
    port: functions.config().db.port || 3306, // Default to 3306 if not set
});

//verify connection between backend server and database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        throw err;
    }
    console.log('Connect to database successfully!');
});

export default db;