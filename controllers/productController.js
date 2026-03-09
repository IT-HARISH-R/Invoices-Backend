import ProductModel from "../models/productModel.js";

const productController = {

  // Create Product
  createProduct: async (req, res) => {
    try {

      const { name, description, price, gstRate } = req.body;

      const product = new ProductModel({
        name,
        description,
        price,
        gstRate,
      });

      await product.save();

      res.status(201).json({
        message: "Product created successfully",
        product
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


  // Get All Products
  getProducts: async (req, res) => {
    try {

      const products = await ProductModel
        .find()

      res.json({ products });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


  // Get Single Product
  getProduct: async (req, res) => {
    try {

      const product = await ProductModel
        .findById(req.params.id)

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ product });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


  // Update Product
  updateProduct: async (req, res) => {
    try {

      const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      res.json({
        message: "Product updated successfully",
        product
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


  // Delete Product
  deleteProduct: async (req, res) => {
    try {

      await ProductModel.findByIdAndDelete(req.params.id);

      res.json({ message: "Product deleted successfully" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

};

export default productController;