
/**
 * ThesisHub — Express Backend Entry Point
 *
 * Responsibilities:
 * 1. Create and configure the Express server.
 * 2. Set up middleware for incoming requests.
 * 3. Define a basic API health-check endpoint.
 * 4. Start listening for HTTP requests.
 */

import "dotenv/config";

// Authentication cannot safely operate without a signing secret.
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in server/.env");
}

// Import Express, a framework for building HTTP APIs.
import express from "express";

// Import CORS middleware to permit requests from our React app.
import cors from "cors";
import { rateLimit } from "./middleware/rateLimit.js";

import { prisma } from "./db.js";

import { authRouter } from "./routes/auth.js";

import { postsRouter } from "./routes/posts.js";

import { marketRouter } from "./routes/market.js";

import { reactionsRouter } from "./routes/reactions.js";

import { repliesRouter } from "./routes/replies.js";

// Create an Express application instance.
// 'app' is the main object used to configure our server.
const app = express();

// Use the PORT environment variable if available.
// Otherwise, default to port 3000.
const PORT = process.env.PORT || 3000;

/**
 * MIDDLEWARE
 *
 * Middleware consists of functions that process HTTP requests
 * before they reach their final route handler.
 */

// Configure Cross-Origin Resource Sharing (CORS).
// Our frontend runs at localhost:5173, while the backend
// runs at localhost:3000. They are different origins.
//
// This configuration allows the browser to make requests
// from our React frontend to the Express backend.
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
}));

// Tell Express to parse JSON request bodies.
app.use(express.json({ limit: "64kb" }));

// Protect public write endpoints and the upstream market-data provider.
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use("/api/market", rateLimit({ windowMs: 60 * 1000, limit: 60 }));

/**
 * GET /api/health
 *
 * Purpose:
 * Check whether the backend server is running.
 *
 * Parameters:
 * req — HTTP request object (unused here).
 * res — HTTP response object.
 *
 * Response:
 * JSON containing the service name and status.
 */
app.get("/api/health", (req, res) => {

    // res.json() sends a JSON response to the client.
    // Express automatically sets the appropriate content type.
    res.json({
        status: "ok",
        service: "thesis-hub-api",
    });
});

/**
 * START THE SERVER
 *
 * app.listen() starts the HTTP server.
 *
 * PORT: The port on which the server listens.
 * Callback: Runs after the server begins listening.
 */


/**
 * GET /api/health/db
 *
 * Purpose:
 * Verify that Express can communicate with PostgreSQL.
 *
 * Returns:
 * 200 — Database connection works.
 * 503 — Database is unavailable.
 */
app.get("/api/health/db", async (req, res) => {
    try {
        // Ask Prisma to count registered users.
        // This executes a real database query.
        // We don't need actual users for the query to succeed.
        await prisma.user.count();

        // Query succeeded: database is accessible.
        res.json({
            status: "ok",
            database: "connected",
        });

    } catch (error) {
        // Log details to the backend terminal for debugging.
        console.error("Database connection error:", error);

        // HTTP 503 indicates the service is unavailable.
        // Don't expose internal database errors to clients.
        res.status(503).json({
            status: "error",
            database: "unavailable",
        });
    }
});

// Mount authentication endpoints under /api/auth.
app.use("/api/auth", authRouter);

// Public reading and authenticated publishing endpoints.
app.use("/api/posts", postsRouter);

app.use("/api/market", marketRouter);

app.use("/api/posts", reactionsRouter);

app.use("/api/posts", repliesRouter);



app.listen(PORT, () => {

    // Log a message so we know the backend has started.
    console.log(`ThesisHub API running on port ${PORT}`);
});
