import NextAuth, { AuthError, CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { User } from "next-auth"

// Extend the User and Session types to include role
declare module "next-auth" {
    interface User {
        role?: string;
        token?: string;
    }
    interface Session {
        accessToken?: string;
        user: {
            id?: string;
            email?: string | null;
            name?: string | null;
            image?: string | null;
            role?: string;
        }
    }
}

class RateLimitedError extends CredentialsSignin {
    code = "RateLimited"
}

class InvalidCredentialsError extends CredentialsSignin {
    code = "InvalidCredentials"
}

const AUTH_API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:5001/api"
).replace(/\/$/, "")

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        throw new InvalidCredentialsError();
                    }

                    // Call existing backend API
                    const res = await fetch(`${AUTH_API_BASE_URL}/auth/login`, {
                        method: "POST",
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                        headers: { "Content-Type": "application/json" },
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        if (res.status === 429) {
                            throw new RateLimitedError();
                        }

                        // Default to authentication failure
                        throw new InvalidCredentialsError();
                    }

                    if (res.ok && data.user) {
                        // Return object that will be saved in the JWT
                        return {
                            id: data.user.id.toString(), // NextAuth expects string IDs
                            email: data.user.email,
                            name: data.user.firstName && data.user.lastName
                                ? `${data.user.firstName} ${data.user.lastName}`
                                : (data.user.firstName || data.user.email.split('@')[0]),
                            role: data.user.role, // Include role from backend
                            token: data.token, // We need to persist this token
                            ...data.user
                        } as User;
                    }

                    return null;
                } catch (error: any) {
                    console.error("Auth Error:", error);
                    // If it's already an AuthError, rethrow it
                    if (error instanceof AuthError) throw error;
                    // Otherwise wrap it
                    throw new InvalidCredentialsError();
                }
            },
        }),
    ],
    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');

            // Protect admin routes - require ADMIN or SUPER_ADMIN role
            if (isOnAdmin) {
                if (!isLoggedIn) return false;
                const userRole = auth?.user?.role;
                if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
                    // Redirect unauthorized users to dashboard
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect user to dashboard if they are already logged in and trying to access login/signup
                const isOnAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/signup' || nextUrl.pathname === '/';
                if (isOnAuthPage) {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }
            return true;
        },
        async jwt({ token, user }: { token: any, user: any }) {
            if (user) {
                token.accessToken = user.token;
                token.userId = user.id;
                token.role = user.role; // Store role in JWT
                token.name = user.name; // Store name in JWT
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (token) {
                session.accessToken = token.accessToken;
                session.user.id = token.userId;
                session.user.role = token.role; // Expose role in session
                session.user.name = token.name; // Ensure name is passed to session
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
})
