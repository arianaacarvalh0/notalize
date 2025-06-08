require('dotenv').config();

module.exports ={
    host: process.env.DB_HOST,
    user: 'root',
    password: '2727',
    database: 'notalize',
    port: process.env.DB_PORT,
}