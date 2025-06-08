const database = require('../models/database');

class Invoice {
    constructor(invoiceData) {
        this.id = invoiceData.id;
        this.invoiceDate = invoiceData.invoice_date;
        this.invoiceServiceTaker = invoiceData.invoice_service_taker;
        this.invoiceCity = invoiceData.invoice_city;
        this.invoiceValue = invoiceData.invoice_value;
    }

    static async saveInvoice(invoices) {
        try {
            const connection = await database.connect();
            const query = 'INSERT INTO invoices (invoice_date, invoice_service_taker, invoice_city, invoice_value) VALUES (?, ?, ?, ?)';
            const insertPromises = [];

            for (const invoice of invoices) {
                if (invoice[0] === 'Geração')
                    continue;

                const params = [
                    this.formatData(invoice[0]), 
                    invoice[1],
                    invoice[2],
                    this.extractValue(invoice[3])
                ];
                insertPromises.push(connection.execute(query, params));
            }
            await Promise.all(insertPromises);
            console.log(`${insertPromises.length} Invoices saved successfully`);
            return true;
        } catch (error) {
            console.error('Error saving invoices:', error);
            return false;
        }
    }

    static formatData(date) {
        const [day, month, year] = date.split('/');
        return `${year}-${month}-${day}`;
    }

    static extractValue(value) {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }
}

module.exports = Invoice;