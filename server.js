const express = require('express');
const app = express();
const invoicesRouter = require('./routes/invoices');
require('dotenv').config();


app.use(express.json());
app.use('/invoices', invoicesRouter);

app.get('/', (req, res) => {
  res.send('Welcome to Notalize API!');
});

const PORT = process.env.API_PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});