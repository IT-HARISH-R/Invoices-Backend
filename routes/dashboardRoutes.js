import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import auth from "../middlewares/auth.js";

const dashboardRoutes = express.Router();

dashboardRoutes.get("/dashboard", auth.checkAuth, getDashboardStats);

export default dashboardRoutes; 
