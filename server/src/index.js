
/**
 * ThesisHub — Express Backend Entry Point
 *
 * Responsibilities:
 * 1. Create and configure the Express server.
 * 2. Set up middleware for incoming requests.
 * 3. Define a basic API health-check endpoint.
 * 4. Start listening for HTTP requests.
 */

// Import Express, a framework for building HTTP APIs.
import express from "express";

// Import CORS middleware to permit requests from our React app.
import cors from "cors";

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
    origin: "http://localhost:5173",
}));

// Tell Express to parse JSON request bodies.
app.use(express.json());

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
app.listen(PORT, () => {

    // Log a message so we know the backend has started.
    console.log(`ThesisHub API running on port ${PORT}`);
});
