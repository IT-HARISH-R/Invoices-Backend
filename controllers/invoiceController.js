import invoiceModel from "../models/invoiceModel.js";
import Product from "../models/productModel.js";
import generateInvoiceNumber from "../utlis/generateInvoiceNumber.js";
import PDFDocument from "pdfkit";

const invoiceController = {

    createInvoice: async (req, res) => {
        try {
            const { customer, items } = req.body;

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
    },



    // DOWNLOAD PDF - Professional Invoice Format with proper layout and styling
    downloadInvoice: async (req, res) => {
        try {
            const invoice = await invoiceModel
                .findById(req.params.id)
                .populate("customer")
                .populate("items.product");

            if (!invoice) {
                return res.status(404).json({ message: "Invoice not found" });
            }

            // Create PDF with professional settings
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Invoice-${invoice.invoiceNumber || '0000'}.pdf`
            );

            doc.pipe(res);

            // Helper function for formatting currency - FIXED to return plain string
            const formatCurrency = (amount) => {
                if (amount === undefined || amount === null || isNaN(amount)) {
                    return '0.00';
                }
                const num = typeof amount === 'string' ? parseFloat(amount) : amount;
                if (isNaN(num)) {
                    return '0.00';
                }
                return num.toFixed(2);
            };

            // Helper function for date formatting
            const formatDate = (date) => {
                if (!date) return new Date().toLocaleDateString('en-IN');
                try {
                    return new Date(date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                } catch (e) {
                    return new Date().toLocaleDateString('en-IN');
                }
            };

            // Company Details
            const companyName = "Sigma Invoice System";
            const companyGST = "33ABCDE1234F1Z5";
            const companyAddress = "Salem, Tamil Nadu - 636502";
            const companyEmail = "sigma@gmail.com";
            const companyPhone = "+91 XXXXXXXXXX";

            // Header Section
            doc.rect(50, 45, 500, 1).fill('#CCCCCC');

            // Company Info on left
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text(companyName, 50, 60);

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#4b5563')
                .text(companyAddress, 50, 80)
                .text(`GSTIN: ${companyGST}`, 50, 95)
                .text(`Email: ${companyEmail} | Phone: ${companyPhone}`, 50, 110);

            // Invoice Title on right
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text('TAX INVOICE', 400, 60, { align: 'right' });

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#4b5563')
                .text(`Invoice #: ${invoice.invoiceNumber || 'INV-2024-0001'}`, 400, 90, { align: 'right' })
                .text(`Date: ${formatDate(invoice.createdAt)}`, 400, 105, { align: 'right' });

            // Separator line
            doc.rect(50, 135, 500, 1).fill('#E5E7EB');

            // Customer Details Box
            doc.rect(50, 150, 245, 100).stroke('#E5E7EB');
            doc.rect(305, 150, 245, 100).stroke('#E5E7EB');

            // Bill To Section
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text('BILL TO', 55, 160);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#111827')
                .text(invoice.customer?.name || 'Customer Name', 55, 180)
                .text(invoice.customer?.address || 'Customer Address', 55, 195)
                .text(`Phone: ${invoice.customer?.phone || 'N/A'}`, 55, 210)
                .text(`Email: ${invoice.customer?.email || 'N/A'}`, 55, 225);

            // GST Details Section
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text('GST DETAILS', 310, 160);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#111827')
                .text(`GSTIN: ${invoice.customer?.gstNumber || 'N/A'}`, 310, 180)
                .text(`State: ${invoice.customer?.state || 'Tamil Nadu'}`, 310, 195)
                .text(`State Code: ${invoice.customer?.stateCode || '33'}`, 310, 210)
                .text(`Place of Supply: ${invoice.customer?.city || 'Salem'}`, 310, 225);

            // Items Table Header - UPDATED COLUMNS
            const tableTop = 280;

            // Table background
            doc.rect(50, tableTop - 5, 500, 25).fill('#F3F4F6');

            // Table headers - NEW LAYOUT
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a');

            const col1 = 55;  // Product
            const col2 = 180; // Qty
            const col3 = 230; // Price
            const col4 = 290; // GST%
            const col5 = 340; // Taxable
            const col6 = 390; // CGST
            const col7 = 440; // SGST
            const col8 = 490; // Total

            doc.text('Product', col1, tableTop);
            doc.text('Qty', col2, tableTop);
            doc.text('Price', col3, tableTop);
            doc.text('GST%', col4, tableTop);
            doc.text('Taxable', col5, tableTop);
            doc.text('CGST', col6, tableTop);
            doc.text('SGST', col7, tableTop);
            doc.text('Total', col8, tableTop);

            // Items
            let y = tableTop + 25;
            doc.font('Helvetica').fillColor('#111827');

            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach((item, index) => {
                    if (item && item.product) {
                        const productName = item.product.name || 'Product';
                        const quantity = item.quantity || 0;
                        const price = parseFloat(item.price) || 0;
                        const gstRate = parseFloat(item.gstRate) || 0;

                        // Calculations
                        const taxable = price * quantity;
                        const cgst = parseFloat(item.itemCGST) || (taxable * (gstRate / 2) / 100);
                        const sgst = parseFloat(item.itemSGST) || (taxable * (gstRate / 2) / 100);
                        const total = parseFloat(item.itemTotalWithGST) || (taxable + cgst + sgst);

                        // Alternate row background
                        if (index % 2 === 0) {
                            doc.rect(50, y - 5, 500, 25).fill('#F9FAFB');
                        }

                        // Product name (truncate if too long)
                        const displayName = productName.length > 15 ? productName.substring(0, 12) + '...' : productName;

                        doc.fontSize(9)
                            .fillColor('#111827')
                            .text(displayName, col1, y)
                            .text(quantity.toString(), col2, y)
                            .text(formatCurrency(price), col3, y)
                            .text(gstRate + '%', col4, y)
                            .text(formatCurrency(taxable), col5, y)
                            .text(formatCurrency(cgst), col6, y)
                            .text(formatCurrency(sgst), col7, y)
                            .text(formatCurrency(total), col8, y);

                        y += 25;
                    }
                });
            } else {
                doc.text('No items found', col1, y);
                y += 20;
            }

            // In the summary section, replace the problematic text rendering with this:

            // Summary Section
            const summaryTop = y + 20;

            // Draw summary box
            doc.rect(350, summaryTop - 10, 200, 140).stroke('#E5E7EB');

            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text('SUMMARY', 360, summaryTop);

            let summaryY = summaryTop + 20;

            // Safe parsing of totals
            const subtotal = parseFloat(invoice.subtotal) || 0;
            const cgst = parseFloat(invoice.cgst) || 0;
            const sgst = parseFloat(invoice.sgst) || 0;
            const totalAmount = parseFloat(invoice.totalAmount) || 0;

            // Taxable Value - FIXED: Convert to string properly to avoid superscript
            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#4B5563')
                .text('Taxable Value:', 360, summaryY);
            doc.font('Helvetica-Bold')
                .fillColor('#111827')
                .text(subtotal.toFixed(2).toString(), 470, summaryY, { align: 'right' });

            summaryY += 15;

            // CGST - FIXED
            doc.font('Helvetica')
                .fillColor('#4B5563')
                .text('CGST:', 360, summaryY);
            doc.font('Helvetica-Bold')
                .fillColor('#059669')
                .text(cgst.toFixed(2).toString(), 470, summaryY, { align: 'right' });

            summaryY += 15;

            // SGST - FIXED
            doc.font('Helvetica')
                .fillColor('#4B5563')
                .text('SGST:', 360, summaryY);
            doc.font('Helvetica-Bold')
                .fillColor('#059669')
                .text(sgst.toFixed(2).toString(), 470, summaryY, { align: 'right' });

            summaryY += 15;

            // Total GST - FIXED
            doc.font('Helvetica')
                .fillColor('#4B5563')
                .text('Total GST:', 360, summaryY);
            doc.font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text((cgst + sgst).toFixed(2).toString(), 470, summaryY, { align: 'right' });

            summaryY += 20;

            // Grand Total - SIMPLEST FIX
            doc.rect(350, summaryY - 5, 200, 25).fill('#EFF6FF');
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text('GRAND TOTAL:', 360, summaryY);

            // Force plain text by using String() constructor
            const totalText = '₹ ' + String(totalAmount.toFixed(2));
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1e3a8a')
                .text(totalText, 470, summaryY, { align: 'right' });

            // Amount in words
            const wordsY = summaryY + 40;
            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#4B5563')
                .text('Amount in words:', 50, wordsY);

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text(numberToWords(totalAmount), 50, wordsY + 15, {
                    width: 450,
                    align: 'left'
                });

            // Terms and Conditions
            const termsY = wordsY + 70;
            doc.rect(50, termsY - 5, 500, 1).fill('#E5E7EB');

            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('Terms & Conditions:', 50, termsY + 5)
                .text('1. Goods once sold will not be taken back or exchanged.', 50, termsY + 20)
                .text('2. This is a computer generated invoice, valid without signature.', 50, termsY + 35)
                .text('3. Subject to jurisdiction.', 50, termsY + 50);

            // Footer
            const footerY = termsY + 80;
            doc.rect(50, footerY - 5, 500, 1).fill('#E5E7EB');

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#9CA3AF')
                .text('Thank you!', 50, footerY, { align: 'center', width: 500 })
                .text(`This is a computer generated invoice - Invoice #${invoice.invoiceNumber || '0000'}`, 50, footerY + 15, { align: 'center', width: 500 });

            doc.end();

            // Helper function for number to words - FIXED
            function numberToWords(num) {
                if (num === undefined || num === null || isNaN(num) || num === 0) {
                    return 'Zero Rupees Only';
                }

                const amount = typeof num === 'string' ? parseFloat(num) : num;

                if (isNaN(amount) || amount === 0) {
                    return 'Zero Rupees Only';
                }

                const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
                const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

                const convert = (n) => {
                    if (n < 10) return ones[n];
                    if (n < 20) return teens[n - 10];
                    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
                    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
                    return n.toString();
                };

                // Handle thousands, lakhs, crores for Indian numbering system
                let result = '';
                let remaining = Math.floor(amount);

                if (remaining >= 10000000) { // Crore
                    const crore = Math.floor(remaining / 10000000);
                    result += convert(crore) + ' Crore ';
                    remaining %= 10000000;
                }
                if (remaining >= 100000) { // Lakh
                    const lakh = Math.floor(remaining / 100000);
                    result += convert(lakh) + ' Lakh ';
                    remaining %= 100000;
                }
                if (remaining >= 1000) { // Thousand
                    const thousand = Math.floor(remaining / 1000);
                    result += convert(thousand) + ' Thousand ';
                    remaining %= 1000;
                }
                if (remaining > 0) {
                    result += convert(remaining);
                }

                return result.trim() + ' Rupees Only';
            }
        }
        catch (err) {
            console.error("PDF download error:", err);
            if (!res.headersSent) {
                res.status(500).json({ message: err.message });
            }
        }
    },




};

export default invoiceController;