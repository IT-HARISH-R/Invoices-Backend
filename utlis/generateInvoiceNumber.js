import invoiceModel from "../models/invoiceModel.js";

const generateInvoiceNumber = async () => {

    const year = new Date().getFullYear();

    const lastInvoice = await invoiceModel
        .findOne()
        .sort({ createdAt: -1 });

    let number = 1;

    if (lastInvoice) {
        const lastNumber = lastInvoice.invoiceNumber.split("-")[2];
        number = parseInt(lastNumber) + 1;
    }

    const padded = String(number).padStart(3, "0");

    return `INV-${year}-${padded}`;
};

export default generateInvoiceNumber;