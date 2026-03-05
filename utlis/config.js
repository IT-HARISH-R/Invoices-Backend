import dov from "dotenv"
dov.config()

export const MONGODB_URL = process.env.MONGODB_URL;
export const PORT = process.env.PORT;
export const SECRET_KEY = process.env.SECRET_KEY;


 