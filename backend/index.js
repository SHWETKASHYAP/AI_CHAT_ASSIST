// 1. Import dependencies
const express = require('express'); // The framework for our server
const http = require('http'); // Built-in Node module to create a server
const { Server } = require('socket.io'); // The WebSocket magic
const cors = require('cors'); // Allows our frontend to talk to our backend
require('dotenv').config(); // Loads our API key from .env

// 2. Initialize the App
const app = express();
app.use(cors()); // Enable CORS so Frontend (Port 3000) can talk to Backend (Port 5000)

// 3. Create the Server
// We wrap 'app' in 'http' because Socket.io needs a raw HTTP server to attach to
const server = http.createServer(app);

// 4. Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Tell Socket.io which frontend URL to trust
        methods: ["GET", "POST"]
    }
});

// 5. The "Connection" Listener
// This runs whenever a user opens the website
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Listen for a message from the user
    socket.on('send_message', (data) => {
        console.log("Message received:", data.text);
        
        // For now, we just broadcast it to everyone
        io.emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// 6. Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});