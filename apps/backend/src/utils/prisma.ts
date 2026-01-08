import { PrismaClient } from '@prisma/client';

// This creates a single, reusable instance of the Prisma Client for your entire application.
const prisma = new PrismaClient();

export default prisma;