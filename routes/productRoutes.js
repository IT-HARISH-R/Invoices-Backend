import express from "express";
import auth from "../middlewares/auth.js";
import productController from "../controllers/productController.js";

const productRoutes = express.Router();

productRoutes.post("/create", auth.checkAuth, productController.createProduct);

productRoutes.get("/", auth.checkAuth, productController.getProducts);

productRoutes.get("/:id", auth.checkAuth, productController.getProduct);

productRoutes.put("/:id", auth.checkAuth, productController.updateProduct);

productRoutes.delete("/:id", auth.checkAuth, productController.deleteProduct);

export default productRoutes;