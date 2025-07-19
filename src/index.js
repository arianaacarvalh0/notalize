const ScraperNFSe = require('./controllers/scrapper');
require('dotenv').config();

async function main() {
  const scraper = new ScraperNFSe();
  const loginSucess = await scraper.login(process.env.LI_USER, process.env.LI_PASS);
  
  if (!loginSucess) {
    console.error('Falha ao fazer login');
    return;
  }
}

main().catch(erro => console.error('Erro no programa principal:', erro));