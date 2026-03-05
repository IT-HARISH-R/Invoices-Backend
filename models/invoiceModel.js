import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
{
    invoiceNumber: {
        type: String,
        required: true
    },

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: Number,
            price: Number,
            total: Number
        }
    ],

    subtotal: Number,
    cgst: Number,
    sgst: Number,
    totalAmount: Number,

    status: {
        type: String,
        enum: ["paid", "pending"],
        default: "pending"
    }

},
{ timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);