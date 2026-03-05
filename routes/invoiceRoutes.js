import express from "express";
import invoiceController from "../controllers/invoiceController.js";

const invoiceRoutes = express.Router();

invoiceRoutes.post("/", invoiceController.createInvoice);

invoiceRoutes.get("/", invoiceController.getInvoices);

invoiceRoutes.get("/:id", invoiceController.getInvoice);

invoiceRoutes.get("/pdf/:id", invoiceController.downloadInvoice);

export default invoiceRoutes;