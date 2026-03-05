import customerModel from "../models/customerModel.js";

const customerController = {

    // Create Customer
    createCustomer: async (req, res) => {
        try {

            const { name, email, phone, address, gstNumber, company } = req.body;

            const customer = new customerModel({
                name,
                email,
                phone,
                address,
                gstNumber,
                company
            });

            await customer.save();

            res.status(201).json({
                message: "Customer created successfully",
                customer
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    // Get all customers
    getCustomers: async (req, res) => {
        try {

            const customers = await customerModel
                .find()
                .populate("company", "name email");

            res.json({ customers });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    // Get single customer
    getCustomer: async (req, res) => {
        try {

            const customer = await customerModel
                .findById(req.params.id)
                .populate("company", "name");

            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }

            res.json({ customer });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    // Update customer
    updateCustomer: async (req, res) => {
        try {

            const customer = await customerModel.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            res.json({
                message: "Customer updated successfully",
                customer
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    // Delete customer
    deleteCustomer: async (req, res) => {
        try {

            await customerModel.findByIdAndDelete(req.params.id);

            res.json({ message: "Customer deleted successfully" });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

};

export default customerController;