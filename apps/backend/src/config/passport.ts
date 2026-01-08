import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../services/encryptionService.js';

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      passReqToCallback: true,
    },
    async (req: any, accessToken, refreshToken, profile, done) => {
      try {
        const userId = req.user.userId; // We'll get this from a JWT middleware

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

        return done(null, profile);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);