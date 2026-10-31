
/**
 * ThesisHub — Database Client
 *
 * Purpose:
 * Provide one shared Prisma Client instance for the backend.
 *
 * Prisma Client translates JavaScript queries into database
 * operations, so we don't need to write SQL manually.
 */

// Import the generated Prisma database client.
import { PrismaClient } from "@prisma/client";

// Create an instance of Prisma Client.
//
// It reads DATABASE_URL from the environment.
// Prisma manages its connection pool internally.
export const prisma = new PrismaClient();
