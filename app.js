import express from "express"
import cors from 'cors'
import authRoute from "./routes/authRoute.js";
import companyRoutes from "./routes/companyRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

const app = express();

app.use(express.json());
app.use(cors(
    {
        origin: ['http://localhost:5173'],
        credentials: true,
    }
))

app.use('/', authRoute)
app.use("/company", companyRoutes);

app.use("/api/customer", customerRoutes);
app.use("/api/products", productRoutes);

app.use("/api/invoice", invoiceRoutes);

app.get("/", (req, res) => {
    res.json("Working Fine Invoices Backend")
})

export default app;