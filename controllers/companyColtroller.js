import companyModel from "../models/companyModel.js";

const companyController = {

    createCompany: async (req, res) => {
        try {

            const { name, email, phone, address, gstNumber } = req.body;

            const company = new companyModel({
                name,
                email,
                phone,
                address,
                gstNumber,
                owner: req.user.id   
            });

            await company.save();

            res.status(201).json({
                message: "Company created successfully",
                company
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    getCompanies: async (req, res) => {
        try {

            const companies = await companyModel
                .find({ owner: req.user.id })
                .populate("owner", "name email");

            res.json({ companies });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    getCompany: async (req, res) => {
        try {

            const company = await companyModel.findById(req.params.id);

            if (!company) {
                return res.status(404).json({ message: "Company not found" });
            }

            res.json({ company });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    updateCompany: async (req, res) => {
        try {

            const company = await companyModel.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            res.json({
                message: "Company updated successfully",
                company
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    deleteCompany: async (req, res) => {
        try {

            await companyModel.findByIdAndDelete(req.params.id);

            res.json({ message: "Company deleted successfully" });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

};

export default companyController;