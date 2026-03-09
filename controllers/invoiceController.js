import invoiceModel from "../models/invoiceModel.js";
import Product from "../models/productModel.js";
import generateInvoiceNumber from "../utlis/generateInvoiceNumber.js";
import PDFDocument from "pdfkit";

const invoiceController = {

    createInvoice: async (req, res) => {
        try {
            const { company, customer, items } = req.body;

            const invoiceNumber = await generateInvoiceNumber();

            let subtotal = 0;
            let totalCGST = 0;
            let totalSGST = 0;

            const processedItems = [];
            for (const item of items) {
                const product = await Product.findById(item.product);
                console.log("product", item.product)

                if (!product) {
                    return res.status(404).json({ message: `Product not found` });
                }

                // Product price * quantity
                const itemTotal = product.price * item.quantity;
                subtotal += itemTotal;

                const gstRate = product.gstRate;

                // Calculate CGST and SGST (half of GST rate each)
                const itemCGST = (itemTotal * (gstRate / 2)) / 100;
                const itemSGST = (itemTotal * (gstRate / 2)) / 100;

                totalCGST += itemCGST;
                totalSGST += itemSGST;

                // Item total with GST
                const itemTotalWithGST = itemTotal + itemCGST + itemSGST;

                processedItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: product.price,
                    gstRate: gstRate,
                    itemCGST: itemCGST,
                    itemSGST: itemSGST,
                    itemTotal: itemTotal,
                    itemTotalWithGST: itemTotalWithGST
                });
            }

            const totalAmount = subtotal + totalCGST + totalSGST;

            const invoice = new invoiceModel({
                invoiceNumber,
                company,
                customer,
                items: processedItems,
                subtotal,
                cgst: totalCGST,
                sgst: totalSGST,
                totalAmount
            });

            await invoice.save();

            // Populate data before sending response
            const populatedInvoice = await invoiceModel
                .findById(invoice._id)
                // .populate("company", "name gstNumber")
                .populate("customer", "name phone email")
                .populate("items.product", "name price gstRate");

            res.status(201).json(populatedInvoice);
        }
        catch (err) {
            console.error("Create invoice error:", err);
            res.status(500).json({ message: err.message });
        }
    },

    // GET ALL INVOICES
    getInvoices: async (req, res) => {
        try {
            const invoices = await invoiceModel
                .find()
                // .populate("company", "name gstNumber")
                .populate("customer", "name phone email")
                .populate("items.product", "name price gstRate")
                .sort({ createdAt: -1 }); // Latest first

            res.json(invoices);
        }
        catch (err) {
            console.error("Get invoices error:", err);
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

            if (!invoice) {
                return res.status(404).json({ message: "Invoice not found" });
            }

            res.json(invoice);
        }
        catch (err) {
            console.error("Get invoice error:", err);
            res.status(500).json({ message: err.message });
        }
    },

    // DOWNLOAD PDF - Updated with item-wise GST and default company check
    downloadInvoice: async (req, res) => {
        try {
            const invoice = await invoiceModel
                .findById(req.params.id)
                .populate("company")
                .populate("customer")
                .populate("items.product");

            if (!invoice) {
                return res.status(404).json({ message: "Invoice not found" });
            }

            const doc = new PDFDocument({ margin: 50 });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${invoice.invoiceNumber || 'invoice'}.pdf`
            );

            doc.pipe(res);

            // Header
            doc.fontSize(20).text("TAX INVOICE", { align: "center" });
            doc.moveDown();

            // Company Details - WITH NULL CHECK
            const companyName = invoice.company?.name || "Your Company Name";
            const companyGST = invoice.company?.gstNumber || "33ABCDE1234F1Z5";
            const companyAddress = invoice.company?.address || "123 Business Street";

            doc.fontSize(12).text(companyName);
            doc.fontSize(10).text(companyAddress);
            doc.fontSize(10).text(`GST: ${companyGST}`);
            doc.moveDown();

            // Invoice Details
            doc.fontSize(10).text(`Invoice No: ${invoice.invoiceNumber || 'N/A'}`);
            doc.text(`Date: ${invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`);
            doc.moveDown();

            // Customer Details - WITH NULL CHECK
            const customerName = invoice.customer?.name || "Customer Name";
            const customerPhone = invoice.customer?.phone || "N/A";
            const customerEmail = invoice.customer?.email || "N/A";
            const customerGST = invoice.customer?.gstNumber || "N/A";

            doc.text(`Bill To: ${customerName}`);
            doc.text(`Phone: ${customerPhone}`);
            doc.text(`Email: ${customerEmail}`);
            doc.text(`GST: ${customerGST}`);
            doc.moveDown();

            // Items Table Header
            const tableTop = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Product', 50, tableTop);
            doc.text('Qty', 200, tableTop);
            doc.text('Price', 270, tableTop);
            doc.text('GST%', 330, tableTop);
            doc.text('Taxable', 380, tableTop);
            doc.text('Total', 450, tableTop);
            doc.font('Helvetica');

            // Items - WITH NULL CHECK
            let y = tableTop + 20;
            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach((item) => {
                    if (item && item.product) {
                        const productName = item.product.name || 'Product';
                        const quantity = item.quantity || 0;
                        const price = item.price || 0;
                        const gstRate = item.gstRate || 18;
                        const taxable = (price * quantity).toFixed(2);
                        const total = item.itemTotalWithGST?.toFixed(2) || (price * quantity * (1 + gstRate / 100)).toFixed(2);

                        doc.text(productName, 50, y);
                        doc.text(quantity.toString(), 200, y);
                        doc.text(`₹${price}`, 270, y);
                        doc.text(`${gstRate}%`, 330, y);
                        doc.text(`₹${taxable}`, 380, y);
                        doc.text(`₹${total}`, 450, y);
                        y += 20;
                    }
                });
            } else {
                doc.text('No items found', 50, y);
                y += 20;
            }

            // Totals - WITH NULL CHECK
            y += 20;
            doc.text(`Subtotal: ₹${invoice.subtotal?.toFixed(2) || '0.00'}`, 400, y);
            y += 15;
            doc.text(`CGST: ₹${invoice.cgst?.toFixed(2) || '0.00'}`, 400, y);
            y += 15;
            doc.text(`SGST: ₹${invoice.sgst?.toFixed(2) || '0.00'}`, 400, y);
            y += 15;
            doc.font('Helvetica-Bold');
            doc.text(`Total: ₹${invoice.totalAmount?.toFixed(2) || '0.00'}`, 400, y);

            // Amount in words (optional)
            y += 30;
            doc.fontSize(8).font('Helvetica');
            doc.text(`Amount in words: ${numberToWords(invoice.totalAmount || 0)}`, 50, y);

            // Footer
            y += 30;
            doc.fontSize(10).text('Thank you', 50, y, { align: 'center', width: 500 });

            doc.end();

            // Helper function for number to words (add this inside function or import)
            function numberToWords(num) {
                if (!num || isNaN(num)) return 'Zero Rupees Only';
                const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
                const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

                const convert = (n) => {
                    if (n < 10) return ones[n];
                    if (n < 20) return teens[n - 10];
                    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
                    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
                    return n.toString();
                };

                return convert(Math.floor(num)) + ' Rupees Only';
            }
        }
        catch (err) {
            console.error("PDF download error:", err);
            // Check if headers already sent
            if (!res.headersSent) {
                res.status(500).json({ message: err.message });
            }
        }
    },

    // Optional: Delete Invoice (if needed)
    deleteInvoice: async (req, res) => {
        try {
            const invoice = await invoiceModel.findByIdAndDelete(req.params.id);

            if (!invoice) {
                return res.status(404).json({ message: "Invoice not found" });
            }

            res.json({ message: "Invoice deleted successfully" });
        }
        catch (err) {
            console.error("Delete invoice error:", err);
            res.status(500).json({ message: err.message });
        }
    }
};

export default invoiceController;