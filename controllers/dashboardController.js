import customerModel from "../models/customerModel.js";
import invoiceModel from "../models/invoiceModel.js";
import productModel from "../models/productModel.js";


export const getDashboardStats = async (req, res) => {
    try {
        const totalCustomers = await customerModel.countDocuments();
        const totalProducts = await productModel.countDocuments();
        const totalInvoices = await invoiceModel.countDocuments();


        const revenueData = await invoiceModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalRevenue = revenueData[0]?.totalRevenue || 0;


        const recentInvoices = await invoiceModel.find()
            .populate("customer", "name")
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            stats: {
                totalCustomers,
                totalProducts,
                totalInvoices,
                totalRevenue
            },
            recentInvoices
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};