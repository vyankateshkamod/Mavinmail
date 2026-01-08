import { Request, Response } from 'express'; // Import the base Express types
import { AuthenticatedRequest } from '../middleware/authMiddleware.js'; // Keep importing our custom type
import prisma from '../utils/prisma.js';
import { getLatestEmails } from '../services/emailService.js';
import { upsertEmailChunks } from '../services/pineconeService.js';

// The function signature now uses the base Express `Request` type to satisfy the router.
export const syncEmails = async (req: Request, res: Response) => {
  // --- THIS IS THE FIX ---
  // We cast the generic 'req' to our specific 'AuthenticatedRequest' type.
  // This tells TypeScript: "Trust me, I know the 'authenticateToken' middleware
  // has already run and added the 'user' property to this request object."
  const authenticatedReq = req as AuthenticatedRequest;
  // -----------------------

  // Now, we use 'authenticatedReq' for the rest of the function to get type safety.
  if (!authenticatedReq.user?.userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID missing from token.' });
  }

  const userId = authenticatedReq.user.userId; // This is a number, as expected.

  try {
    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: { userId: Number(userId), provider: 'google' }
    });

    if (!connectedAccount?.refreshToken) {
      return res.status(401).json({ message: 'Google account refresh token not found.' });
    }
    
    const emails = await getLatestEmails(Number(userId), 5);

    if (emails.length === 0) {
      return res.json({ message: 'No new emails found to sync.' });
    }

    const userNamespace = String(userId);

    
    for (const email of emails) {
  await upsertEmailChunks(
    email.content,
    email.id,
    userNamespace,
    {
      messageId: email.messageId,        // MUST exist
      subject: email.subject,            // MUST exist
      from: email.from,                  // MUST exist
      to: email.to,                      // MUST exist
      timestamp: email.timestamp,        // MUST be ISO string
    }
  );
}
    res.json({ message: `Successfully synced and indexed ${emails.length} emails.` });

  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ message: "Failed to sync emails." });
  }
};