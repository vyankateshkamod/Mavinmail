import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../services/encryptionService.js';
import { google } from 'googleapis';

const prisma = new PrismaClient();

// Controller to get the status of the user's Google connection
export const getConnectionStatus = async (req: any, res: Response) => {
  const userId = req.user.userId;

  try {
    const googleAccount = await prisma.connectedAccount.findFirst({
      where: { userId: Number(userId), provider: 'google' },
    });

    if (googleAccount) {
      res.status(200).json({ isConnected: true, email: googleAccount.email });
    } else {
      res.status(200).json({ isConnected: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error checking connection status' });
  }
};

// Controller to disconnect a Google account
export const disconnectGoogleAccount = async (req: any, res: Response) => {
  const userId = req.user.userId;

  try {
    const account = await prisma.connectedAccount.findFirst({
      where: { userId: Number(userId), provider: 'google' },
    });

    if (account) {
      // CRITICAL STEP: Revoke the token with Google first.
      // This tells Google the user has withdrawn permission.
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        // We need to decrypt the token to revoke it.
        const decryptedToken = decrypt(account.refreshToken || account.accessToken);
        await oauth2Client.revokeToken(decryptedToken);
        console.log(`Successfully revoked token for user ${userId}`);
      } catch (revocationError) {
        console.error('Failed to revoke Google token, but proceeding with DB deletion:', revocationError);
      }

      // Now, delete the record from our database.
      await prisma.connectedAccount.delete({
        where: { id: account.id },
      });
    }

    res.status(200).json({ message: 'Account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during disconnection' });
  }
};

// ====================================================================
// =====> NEW: Handlers for User Preferences <=====
// ====================================================================

export const getPreferences = async (req: any, res: Response) => {
  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { preferredModel: true }, // Only fetch what we need
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      preferredModel: user.preferredModel || process.env.DEFAULT_AI_MODEL || 'google/gemini-2.0-flash-exp:free',
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Failed to fetch preferences' });
  }
};

export const updatePreferences = async (req: any, res: Response) => {
  const userId = req.user.userId;
  const { preferredModel } = req.body;

  if (!preferredModel) {
    return res.status(400).json({ message: 'preferredModel is required' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { preferredModel },
    });

    console.log(`✅ Updated model preference for user ${userId} to: ${preferredModel}`);

    res.status(200).json({
      message: 'Preferences updated successfully',
      preferredModel: user.preferredModel,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};