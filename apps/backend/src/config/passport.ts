import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../utils/prisma.js';
import { encrypt } from '../services/encryptionService.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const userId = req.user!.userId; // Set by authMiddleware

        // Encrypt tokens for secure storage
        const encryptedAccessToken = encrypt(accessToken);
        const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

        await prisma.connectedAccount.upsert({
          where: {
            userId_provider: {
              userId,
              provider: 'google',
            },
          },
          update: {
            email: profile.emails![0].value,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
          },
          create: {
            userId,
            provider: 'google',
            email: profile.emails![0].value,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
          },
        });

        return done(null, profile as any);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);