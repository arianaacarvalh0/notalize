const express = require('express');
const router = express.Router();
const ScraperNFSe = require('/home/ariana/Projects/Notalize/src/controllers/scrapper.js');
const scrapper = new ScraperNFSe();

router.post('/scrapper', async (req,res) =>{
  const { user, password } = req.body;
  if (!user || !password) {
    return res.status(400).json({ error: 'User and password are required' });
  }
  try{
    const invoices = await scrapper.login(user, password);
      if (!invoices) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ message: 'Login successful', invoices });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

module.exports = router;