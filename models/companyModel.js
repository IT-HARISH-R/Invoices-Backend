import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: { type: String },

        phone: { type: String },

        address: { type: String },

        gstNumber: { type: String },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }

    },
    { timestamps: true }
);

const companyModel = mongoose.model("Company", companySchema);

export default companyModel;