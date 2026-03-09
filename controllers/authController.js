import UserModel from "../models/UserModel.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { SECRET_KEY } from "../utlis/config.js";

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

    },

    login: async (req, res) => {
        const { email, password } = req.body
        try {
            const user = await UserModel.findOne({ email })

            if (!user) return res.status(400).json({ message: 'User not found' })

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

            const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '7d' })

            res.json({ token, name: user.name, status: true })

        } catch (err) {
            res.status(500).json(err)
        }
    },

    profile: async (req, res) => {
        try {
            const userid = req.user.id

            const user = await UserModel.findById(userid).select('-password -__v')

            if (!user) {
                return res.status(404).json({ message: "user not found" });
            }

            res.json({ user })
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default authController;