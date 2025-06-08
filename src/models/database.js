const mysql = require('mysql2');
const dbConfig = require('../../config/database');

let conected = false;

async function connect() {
    if (conected) {
        return conected;
    }

    try {
        conected = await mysql.createConnection(dbConfig);
        console.log('MySQL connection successful');
        return conected;
    } catch (error) {
        console.error('Error connecting to MySQL:', error);
        throw error;
    }
}

async function initDatabase() {
    const connection = await connect();

    try{
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_date DATE NOT NULL,
                invoice_service_taker VARCHAR(255) NOT NULL,
                invoice_city VARCHAR(255) NOT NULL,
                invoice_value DECIMAL(10, 2) NOT NULL
        )`);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = {
    connect,
    initDatabase
};