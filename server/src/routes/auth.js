
/**
 * ThesisHub — Authentication Routes
 *
 * Handles account registration and (later) login.
 */
import jwt from "jsonwebtoken";
import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

// Express Router lets us group related API endpoints.
export const authRouter = Router();

/**
 * POST /api/auth/register
 *
 * Expected JSON body:
 * {
 *   "username": "example_user",
 *   "email": "example@example.com",
 *   "password": "secure-password"
 * }
 */
authRouter.post("/register", async (req, res) => {
    // Extract submitted fields from the JSON request body.
    const { username, email, password } = req.body ?? {};

    // Validate input types before using string methods.
    if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            error: "Username, email, and password are required.",
        });
    }

    // Normalize usernames and email addresses.
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Restrict usernames to predictable, URL-friendly characters.
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
        return res.status(400).json({
            error: "Username must contain 3-30 letters, numbers, or underscores.",
        });
    }

    // Basic email format validation.
    // More comprehensive email validation can be added later.
    if (
        normalizedEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
        return res.status(400).json({
            error: "Invalid email address.",
        });
    }

    // bcrypt processes at most 72 bytes of password input.
    // Enforce that limit to prevent silent truncation.
    if (
        password.length < 12 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        return res.status(400).json({
            error: "Password must contain at least 12 characters and at most 72 bytes.",
        });
    }

    try {
        // Hash the password before saving it.
        // Cost factor 12 controls the computational work required.
        const passwordHash = await bcrypt.hash(password, 12);

        // Save the user to PostgreSQL through Prisma.
        const user = await prisma.user.create({
            data: {
                username: normalizedUsername,
                email: normalizedEmail,
                passwordHash,
            },

            // Explicitly exclude passwordHash from the response.
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
            },
        });

        // HTTP 201 means a new resource was created.
        return res.status(201).json({ user });

    } catch (error) {
        // Prisma error P2002 indicates a UNIQUE constraint violation.
        // Our schema requires unique usernames and email addresses.
        if (error.code === "P2002") {
            return res.status(409).json({
                error: "Username or email is already registered.",
            });
        }

        // Avoid exposing internal database errors to API clients.
        console.error("Registration failed:", error);

        return res.status(500).json({
            error: "Registration failed.",
        });
    }
});



/**
 * POST /api/auth/login
 *
 * Validates credentials and returns a signed JWT.
 *
 * Expected body:
 * {
 *   "email": "example@example.com",
 *   "password": "user-password"
 * }
 */
authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body ?? {};

    // Validate input types before processing credentials.
    if (
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            error: "Email and password are required.",
        });
    }

    try {
        // Search for the account by its normalized email.
        const user = await prisma.user.findUnique({
            where: {
                email: email.trim().toLowerCase(),
            },
        });

        // Use the same error for unknown users and wrong passwords.
        // This avoids revealing whether an email is registered.
        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password.",
            });
        }

        // Compare the submitted password with the stored bcrypt hash.
        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password.",
            });
        }

        // Create a signed token containing the user's ID.
        // The token expires after two hours.
        const token = jwt.sign(
            { sub: user.id },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "2h",
            }
        );

        // Return only public user information.
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login failed:", error);

        return res.status(500).json({
            error: "Login failed.",
        });
    }
});


/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's information.
 * Requests must include a valid JWT.
 */
authRouter.get("/me", requireAuth, async (req, res) => {
    try {
        // The authentication middleware provides req.userId.
        const user = await prisma.user.findUnique({
            where: { id: req.userId },

            // Never expose the password hash.
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
            },
        });

        // A valid token may reference a deleted account.
        if (!user) {
            return res.status(401).json({
                error: "User account no longer exists.",
            });
        }

        return res.json({ user });

    } catch (error) {
        console.error("Failed to retrieve user:", error);

        return res.status(500).json({
            error: "Could not retrieve user.",
        });
    }
});
