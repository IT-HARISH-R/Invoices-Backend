import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    price: {
        type: Number,
        required: true
    },

    gstRate: {
        type: Number,
        default: 18
    },

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    }

},
{ timestamps: true }
);

const productModel = mongoose.model("Product", productSchema);

export default productModel;