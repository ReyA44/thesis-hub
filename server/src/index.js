/**
 * Start the standalone ThesisHub API. Import createApp() from app.js
 * when running the HTTP integration tests (no fixed port required).
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./db.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
    throw new Error("Set JWT_SECRET to a random secret of at least 24 characters in server/.env");
}

const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, () => {
    console.log(`ThesisHub API running on port ${port}`);
});

// Give active requests a chance to complete, then release Prisma connections.
async function shutdown() {
    server.close(async () => {
        await prisma.$disconnect();
    });
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
