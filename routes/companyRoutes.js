import express from "express";
import auth from "../middlewares/auth.js";
import companyController from "../controllers/companyColtroller.js";

const companyRoutes = express.Router();

companyRoutes.post("/create", auth.checkAuth, companyController.createCompany);

companyRoutes.get("/", auth.checkAuth, companyController.getCompanies);

companyRoutes.get("/:id", auth.checkAuth, companyController.getCompany);

companyRoutes.put("/:id", auth.checkAuth, companyController.updateCompany);

companyRoutes.delete("/:id", auth.checkAuth, companyController.deleteCompany);

export default companyRoutes;