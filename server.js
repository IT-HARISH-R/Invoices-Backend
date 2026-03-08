import mongoose from "mongoose"
import { MONGODB_URL, PORT } from "./utlis/config.js"
import app from "./app.js"


mongoose.connect(MONGODB_URL)
    .then(() => {
        console.log("✅ Database connected successfully")
        app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);

        })
    })
    .catch((error) => {
        console.error("❌ Database connection failed: ", error)
    }) 