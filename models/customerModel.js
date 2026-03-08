import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String
        },

        phone: {
            type: String
        },

        address: {
            type: String
        },

        gstNumber: {
            type: String,
            unique: true
        },

        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
        }

    },
    { timestamps: true }
);

const customerModel = mongoose.model("Customer", customerSchema);

export default customerModel;