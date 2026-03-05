import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../utlis/config.js";

const auth = {
    checkAuth: async (req, res, next) => {
        try {

            // Get token from header
            const token = req.headers.authorization;
            console.log(req.headers.authorization)
            if (!token) {
                return res.status(401).json({ message: "Token not provided" });
            }

            // Remove Bearer
            const actualToken = token.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(actualToken, SECRET_KEY);

            // Store user data in request
            req.user = decoded;

            // Move to next middleware
            next();

        }
        catch (err) {
            res.status(401).json({ message: "Invalid or expired token" });
        }
    }
}

export default auth;