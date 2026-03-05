import express from 'express'
import authController from '../controllers/authController.js'
import auth from '../middlewares/auth.js'

const authRoute = express.Router()

authRoute.post('/register', authController.register)
authRoute.post('/login', authController.login)
authRoute.get('/profile', auth.checkAuth, authController.profile)

export default authRoute