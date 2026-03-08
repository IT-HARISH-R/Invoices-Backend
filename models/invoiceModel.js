import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        gstRate: {              
            type: Number,
            default: 18
        },
        itemCGST: {              
            type: Number,
            default: 0
        },
        itemSGST: {              
            type: Number,
            default: 0
        },
        itemTotal: {            
            type: Number,
            required: true
        },
        itemTotalWithGST: {     
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    cgst: {
        type: Number,
        required: true
    },
    sgst: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const invoiceModel = mongoose.model("Invoice", invoiceSchema);
export default invoiceModel;