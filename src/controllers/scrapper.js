const axios = require("axios");
const cheerio = require("cheerio");
const database = require("../models/database");
const Invoice = require("../models/invoice");

class ScraperNFSe {
  constructor() {
    this.urlBase = "https://www.nfse.gov.br/EmissorNacional";
    this.urlLogin = `${this.urlBase}/Login?ReturnUrl=%2fEmissorNacional%2fNotas%2fEmitidas`;
    this.urlNotasEmitidas = `${this.urlBase}/Notas/Emitidas`;
    this.cookies = "";
  }

  async initialize(){
    try {
      await database.initDatabase();
      console.log("Database initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing database:", error);
      return false;
    }
  }

  async login(user, password) {
    try {
      const databaseInitialized = await this.initialize();
      if (!databaseInitialized) {
        return false;
      }

      console.log("Obtendo token de autenticação...");
      const response = await axios.get(this.urlLogin);
      const $ = cheerio.load(response.data);
      const token = $('input[name="__RequestVerificationToken"]').val();

      if (!token) {
        console.error("Não foi possível obter o token de autenticação.");
        return false;
      }

      const loginData = {
        Inscricao: user,
        Senha: password,
        __RequestVerificationToken: token,
      };

      console.log("Enviando dados de login...");
      const loginResponse = await axios.post(this.urlLogin, loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        },
      });

      if (loginResponse.headers["set-cookie"]) {
        this.cookies = loginResponse.headers["set-cookie"].join("; ");
      } else {
        console.error("Não foi possível obter cookies da resposta.");
        return false;
      }

      console.log('Login realizado com sucesso!');
      const invoiceData = await this.scrapeInvoiceData();
      if (invoiceData && invoiceData.length > 0) {
        const saved = await Invoice.saveInvoice(invoiceData);
        if (saved) {
          console.log("Dados salvos com sucesso!");
        } else {
          console.error("Erro ao salvar os dados.");
        }
      } else {
        console.error("Nenhum dado encontrado para salvar.");
      }
      return invoiceData
    } catch (error) {
      console.error('Erro no login:', error.message);
      return false;
    }
  }

  async scrapeInvoiceData() {
    const axiosInstance = axios.create({
      headers: {
        Cookie: this.cookies
      },
      withCredentials: true,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });
    
    let allData = [];
    let headers = [];
    let currentPage = 1;
    const columnsToRemove = ['Situação', 'Impostos', ''];

    try {
      while (true) {
        const pageUrl = `${this.urlNotasEmitidas}?pg=${currentPage}`;
        console.log(`Acessando página: ${pageUrl}`);
        const pageResponse = await axiosInstance.get(pageUrl);
        const $ = cheerio.load(pageResponse.data);

        const table = $('table.table-striped');

        if (table.length === 0) {
          console.log('Tabela não encontrada nesta página.');
          break;
        }

        if (currentPage === 1 && allData.length === 0) {
          const originalHeaders = [];
          table.find('thead th').each((i, el) => {
            originalHeaders.push($(el).text().trim());
          });

          const removeIndices = [];
          columnsToRemove.forEach(col => {
            const index = originalHeaders.indexOf(col);
            if (index !== -1) {
              removeIndices.push(index);
            }
          });

          headers = originalHeaders.filter((_, i) => !removeIndices.includes(i));
          allData.push(headers);
        }

        let rowsFound = false;
        table.find('tbody tr').each((i, tr) => {
          rowsFound = true;
          const originalCells = [];
          
          $(tr).find('td').each((j, td) => {
            const text = $(td).text()
              .replace(/Visualizar|Substituir|Cancelar NFS-e|Download XML|Download DANFS-e/g, '')
              .replace(/\s+/g, '')
              .trim();
            originalCells.push(text);
          });

          const effectiveRemoveIndices = headers.length > 0 ? 
            columnsToRemove.map(col => headers.indexOf(col)).filter(idx => idx !== -1) : [];
          const rowData = originalCells.filter((_, idx) => !effectiveRemoveIndices.includes(idx));

          if (rowData.length) {
            allData.push(rowData);
          }
        });

        if (!rowsFound) {
          console.log('Nenhuma linha encontrada nesta página.');
          break;
        }

        const nextPageLink = $('ul.pagination li.active + li a');
        if (nextPageLink.length && !isNaN(parseInt(nextPageLink.text().trim()))) {
          currentPage++;
        } else {
          console.log('Não há mais páginas para coletar.');
          break;
        }
      }
    } catch (error) {
      console.error(`Erro ao acessar as páginas: ${error.message}`);
    }

    if (allData.length > 0) {
      console.log('\n--- Dados Coletados ---');
      allData.forEach(row => {
        console.log(row.join(' | '));
      });
      console.log('--- Fim dos Dados ---');
      return allData;
    } else {
      console.log("Nenhum dado coletado.");
      return [];
    }
  }
}

module.exports = ScraperNFSe;