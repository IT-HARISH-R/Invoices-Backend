import UserModel from "../middlewares/UserModel.js";
import bcrypt from "bcrypt"

const authController = {
    register: async (req, res) => {

        const { name, email, password } = req.body;
        try {
            const existingUser = await UserModel.findOne({ email })
            if (existingUser) return res.status(400).json({ message: 'Email already exists' })
            const hashed = await bcrypt.hash(password, 10)
            const user = await UserModel.create({ name, email, password: hashed })

            res.status(201).json({ message: 'Registered successfully' })
        } catch (err) {
            res.status(500).json({ message: err.message })
        }

    }
}

export default authController;