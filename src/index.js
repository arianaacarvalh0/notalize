const ScraperNFSe = require('./controllers/scrapper');

async function main() {
  const scraper = new ScraperNFSe();
  const loginSucess = await scraper.login('48622727000137', '272707F@f');
  
  if (!loginSucess) {
    console.error('Falha ao fazer login');
    return;
  }
}

main().catch(erro => console.error('Erro no programa principal:', erro));