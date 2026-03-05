import express from "express"
import cors from 'cors'
import authRoute from "./routes/authRoute.js";

const app = express();

app.use(express.json());
app.use(cors(
    {
        origin: ['http://localhost:5173'],
        credentials: true,
    }
))

app.use('/',authRoute)

app.get("/", (req, res) => {
    res.json("Working Fine Invoices Backend")
})

export default app;