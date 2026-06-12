import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
})

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'PlacementOS backend running 🚀' })
})

// Socket connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`)
    })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

export { io }