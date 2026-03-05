import express from "express";
import customerController from "../controllers/customerController.js";
import auth from "../middlewares/auth.js";

const customerRoutes = express.Router();

customerRoutes.post("/create", auth.checkAuth, customerController.createCustomer);

customerRoutes.get("/", auth.checkAuth, customerController.getCustomers);

customerRoutes.get("/:id", auth.checkAuth, customerController.getCustomer);

customerRoutes.put("/:id", auth.checkAuth, customerController.updateCustomer);

customerRoutes.delete("/:id", auth.checkAuth, customerController.deleteCustomer);

export default customerRoutes;