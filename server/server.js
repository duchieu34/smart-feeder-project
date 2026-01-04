import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import "dotenv/config";

import deviceRoutes from "./routes/device.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import userRoutes from "./routes/user.routes.js";
import { authMiddleware } from "./middlewares/auth.js";

import { setSocketIo } from "./mqttService.js";

const app = express();

// CORS
app.use(
    cors({
        origin: process.env.FRONTEND_BASE_URL || "*",
    })
);

app.use(express.json());

app.use("/api/devices", authMiddleware, deviceRoutes);
app.use("/api/schedules", authMiddleware,scheduleRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/users", userRoutes);

// HTTP + WebSocket server
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_BASE_URL || "*",
    },
});

setSocketIo(io);

// Start server
const PORT = process.env.PORT || 3050;
server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
