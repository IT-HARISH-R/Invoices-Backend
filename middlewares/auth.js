import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../utlis/config.js";
import UserModel from "../models/UserModel.js";

const auth = {
    checkAuth: async (req, res, next) => {
        try {
            // Get token from header
            const token = req.headers.authorization;
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
    },
    allowRoles: (roles) => {
        return async (req, res, next) => {
            try {
                const userId = req.user.id;
                // console.log(userId)
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                console.log(userId)
                const user = await UserModel.findById(userId);
                if (!user) {
                    return res.status(401).json({ message: "User not found" });
                }

                if (!roles.includes(user.role)) {
                    return res.status(403).json({ message: "Forbidden: Insufficient role" });
                }

                next();
            } catch (err) {
                console.error("Role Middleware Error:", err.message);
                res.status(500).json({ message: "Server error" });
            }
        };
    },
}


export default auth;