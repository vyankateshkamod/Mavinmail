import { type Request, type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createUser, loginUser, connectGoogleAccount } from '../services/authService.js';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { decrypt } from '../services/encryptionService.js';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await createUser(email, password);
    res.status(201).json({ user, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    res.status(200).json({ user, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// 1. Create the Google OAuth Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// 2. Controller to generate the Auth URL
export const getGoogleAuthUrl = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId; // From authMiddleware

  try {
    // Check if the user has custom Google OAuth credentials
    const settings = await prisma.userSettings.findUnique({
      where: { userId: Number(userId) },
      select: { googleClientId: true }
    });
    
    const useCustomCredentials = !!settings?.googleClientId;

    // Create a short-lived JWT to use as the 'state' (CSRF protection)
    const stateToken = jwt.sign({ userId, useCustomCredentials }, process.env.JWT_SECRET!, { expiresIn: '10m' });

    let activeOauth2Client = oauth2Client;
    if (useCustomCredentials && settings?.googleClientId) {
      activeOauth2Client = new google.auth.OAuth2(
        settings.googleClientId as string,
        '', // We don't need the secret just to generate the URL
        process.env.GOOGLE_CALLBACK_URL
      );
    }

    const url = activeOauth2Client.generateAuthUrl({
      access_type: 'offline', // Important to get a refresh token
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
      state: stateToken, // Pass the JWT as the state
    });

    res.status(200).json({ url });
  } catch (error) {
    logger.error('Error generating Google Auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth url' });
  }
};

// 3. Controller to handle the callback from Google
export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      throw new Error('Missing code or state from Google callback');
    }

    // Verify the state token to get the user ID
    const decodedState: any = jwt.verify(state as string, process.env.JWT_SECRET!);
    const userId = decodedState.userId;
    const useCustomCredentials = decodedState.useCustomCredentials || false;

    let activeOauth2Client = oauth2Client;
    if (useCustomCredentials) {
      const settings = await prisma.userSettings.findUnique({
        where: { userId: Number(userId) },
      });
      if (!settings || !settings.googleClientId || !settings.googleClientSecret) {
         throw new Error('Custom credentials not found for user');
      }
      activeOauth2Client = new google.auth.OAuth2(
        settings.googleClientId,
        decrypt(settings.googleClientSecret),
        process.env.GOOGLE_CALLBACK_URL
      );
    }

    // Exchange the authorization code for tokens
    const { tokens } = await activeOauth2Client.getToken(code as string);
    const { access_token, refresh_token } = tokens;

    // Get user's email from Google
    activeOauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: activeOauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!access_token || !data.email) {
      throw new Error('Failed to retrieve token or email from Google.');
    }

    // Save the encrypted tokens to the database
    await connectGoogleAccount({
      userId,
      email: data.email,
      accessToken: access_token,
      refreshToken: refresh_token || null,
    });

    // 4. Perform Initial "Virtual" Sync to populate Dashboard Stats
    try {
      const gmail = google.gmail({ version: 'v1', auth: activeOauth2Client });

      // A. Get Total Emails (Profile)
      const profileRes = await gmail.users.getProfile({ userId: 'me' });
      const totalMessages = profileRes.data.messagesTotal || 0;

      // B. Get Emails Received Today (Estimate)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startEpoch = Math.floor(startOfDay.getTime() / 1000);

      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: `after:${startEpoch}`,
        maxResults: 1, // We only need the estimate
        includeSpamTrash: false // usually we want inbox stats
      });

      const todayCount = listRes.data.resultSizeEstimate || 0;
      const historicCount = Math.max(0, totalMessages - todayCount);

      // Uses module-level singleton prisma client

      // C. Insert SyncHistory Records
      // Record 1: Historic Data (Backdated to yesterday) - Contributes to Total, but not Today
      if (historicCount > 0) {
        await prisma.syncHistory.create({
          data: {
            userId,
            emailCount: historicCount,
            status: 'success',
            syncedAt: new Date(Date.now() - 86400000), // 24h ago
          }
        });
      }

      // Record 2: Today's Data (Now) - Contributes to Total AND Today
      if (todayCount > 0 || historicCount === 0) { // Always create at least one record if empty
        await prisma.syncHistory.create({
          data: {
            userId,
            emailCount: todayCount,
            status: 'success',
            syncedAt: new Date(),
          }
        });
      }

      logger.info(`[Initial Sync] Populated stats for user ${userId}: ${todayCount} today, ${historicCount} historic.`);

    } catch (syncError) {
      logger.error('[Initial Sync] Failed to fetch initial stats:', syncError);
      // We don't block the redirect, just log the error
    }

    // Redirect user back to the dashboard with a success message
    // Support both old dashboard (3000) and new dashboard-static
    // Use environment variable if set, otherwise default to new dashboard
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    res.redirect(`${dashboardUrl}/dashboard?success=gmail_connected`);

  } catch (error) {
    logger.error('Google callback error:', error);
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    res.redirect(`${dashboardUrl}/dashboard?error=auth_failed`);
  }
};