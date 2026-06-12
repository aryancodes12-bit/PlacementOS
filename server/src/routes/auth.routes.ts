import { Router } from 'express'
import {
    register,
    login,
    googleAuth,
    refreshToken,
    getMe
} from '../controllers/auth.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.post('/refresh', refreshToken)
router.get('/me', protect, getMe)       // protected route

export default router