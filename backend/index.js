// 1. Import dependencies
const { OpenAI } = require('openai');
const express = require('express'); // The framework for our server
const http = require('http'); // Built-in Node module to create a server
const { Server } = require('socket.io'); // The WebSocket magic
const cors = require('cors'); // Allows our frontend to talk to our backend
require('dotenv').config(); // Loads our API key from .env

// 2. Initialize the App
const app = express();
app.use(cors()); // Enable CORS so Frontend (Port 5173) can talk to Backend (Port 5000)

const openai = new OpenAI({   // Initialize OpenAI client
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper Function: Mock AI Logic (The Fallback)
// This runs if the OpenAI API fails or the quota is exceeded.
const getMockSentiment = (text) => {
    const lowText = text.toLowerCase();
    if (lowText.includes("good") || lowText.includes("happy") || lowText.includes("love") || lowText.includes("great")) {
        return "Sentiment: Positive, Emoji: 😊";
    } else if (lowText.includes("bad") || lowText.includes("angry") || lowText.includes("sad") || lowText.includes("hate")) {
        return "Sentiment: Negative, Emoji: 😠";
    }
    return "Sentiment: Neutral, Emoji: 😐";
};

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
    socket.on('send_message', async (data) => {
        let sentimentResult = "";
        let isRealAI = false;

        try {
            // 1. Attempt to call OpenAI to analyze sentiment
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a sentiment analyzer. Respond with only ONE word: 'Positive', 'Neutral', or 'Negative'. and suggest an emoji that represents the sentiment. Format: Sentiment: [word], Emoji: [emoji]" 
                    },
                    { role: "user", content: data.text },
                ],
                max_tokens: 20, // Increased slightly to accommodate the emoji format
            });

            sentimentResult = completion.choices[0].message.content.trim();
            isRealAI = true;
            console.log(`Real AI -> Message: ${data.text} | Result: ${sentimentResult}`);

        } catch (error) {
            // 2. Fallback: If OpenAI fails (quota, network, etc.), use Mock AI
            console.warn("OpenAI API Issue. Falling back to Mock Analysis...");
            sentimentResult = getMockSentiment(data.text);
            isRealAI = false;
        }

        // 3. Add the result and AI-type flag to our data packet
        const enrichedData = {
            ...data,
            sentiment: sentimentResult,
            isRealAI: isRealAI 
        };

        // 4. Shouting the enriched message to everyone
        io.emit('receive_message', enrichedData);
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