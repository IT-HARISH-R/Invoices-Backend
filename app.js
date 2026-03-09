import express from "express"
import cors from 'cors'
import authRoute from "./routes/authRoute.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

app.use(express.json());
app.use(cors(
    {
        // origin: ['http://localhost:5173'],
        origin: ["https://sigma-invoice.netlify.app"],
        credentials: true,
    }
))

app.use('/', authRoute)

app.use("/api/customer", customerRoutes);
app.use("/api/products", productRoutes);

app.use("/api/invoice", invoiceRoutes);

app.use("/api", dashboardRoutes);


app.get("/", (req, res) => {
    res.json("Working Fine Invoices Backend")
})

export default app;