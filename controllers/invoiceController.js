import invoiceModel from "../models/invoiceModel.js";
import Product from "../models/productModel.js";
import generateInvoiceNumber from "../utlis/generateInvoiceNumber.js";
import PDFDocument from "pdfkit";

const invoiceController = {

    // CREATE INVOICE
    createInvoice: async (req, res) => {
        try {

            const { company, customer, items } = req.body;

            const invoiceNumber = await generateInvoiceNumber();

            let subtotal = 0;

            const processedItems = [];

            for (const item of items) {

                const product = await Product.findById(item.product);

                const total = product.price * item.quantity;

                subtotal += total;

                processedItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: product.price,
                    total
                });
            }

            const cgst = subtotal * 0.09;
            const sgst = subtotal * 0.09;
            const totalAmount = subtotal + cgst + sgst;

            const invoice = new invoiceModel({
                invoiceNumber,
                company,
                customer,
                items: processedItems,
                subtotal,
                cgst,
                sgst,
                totalAmount
            });

            await invoice.save();

            res.status(201).json(invoice);

        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    },



    // GET ALL INVOICES
    getInvoices: async (req, res) => {
        try {

            const invoices = await invoiceModel
                .find()
                .populate("company", "name gstNumber")
                .populate("customer", "name phone email")
                .populate("items.product", "name price");

            res.json(invoices);

        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    },



    // GET SINGLE INVOICE
    getInvoice: async (req, res) => {
        try {

            const invoice = await invoiceModel
                .findById(req.params.id)
                .populate("company")
                .populate("customer")
                .populate("items.product");

            res.json(invoice);

        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    },



    // DOWNLOAD PDF
    downloadInvoice: async (req, res) => {
        try {

            const invoice = await invoiceModel
                .findById(req.params.id)
                .populate("company")
                .populate("customer")
                .populate("items.product");

            const doc = new PDFDocument();

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${invoice.invoiceNumber}.pdf`
            );

            doc.pipe(res);

            doc.fontSize(20).text("INVOICE", { align: "center" });

            doc.moveDown();

            doc.text(`Invoice No: ${invoice.invoiceNumber}`);
            doc.text(`Company: ${invoice.company.name}`);
            doc.text(`Customer: ${invoice.customer.name}`);

            doc.moveDown();

            invoice.items.forEach((item) => {
                doc.text(
                    `${item.product.name} - ${item.quantity} x ₹${item.price} = ₹${item.total}`
                );
            });

            doc.moveDown();

            doc.text(`Subtotal: ₹${invoice.subtotal}`);
            doc.text(`CGST: ₹${invoice.cgst}`);
            doc.text(`SGST: ₹${invoice.sgst}`);
            doc.text(`Total: ₹${invoice.totalAmount}`);

            doc.end();

        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

};

export default invoiceController;