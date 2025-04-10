// auth.ts (create this file at your project root or in /lib)

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db"; // Make sure path is correct relative to auth.ts
import { users } from "@/lib/db/schema"; // Make sure path is correct
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({ // Export auth, signIn, signOut here
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Consider adding error handling (try/catch) around DB calls
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email as string), // Ensure type safety if needed
          });

          if (!user || !user.password) {
             console.error("Credentials Auth: User not found or password not set for", credentials.email);
             return null;
          }

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) {
            console.error("Credentials Auth: Password mismatch for", credentials.email);
            return null;
          }

          // Update last login (optional, consider if really needed on every auth)
          // await db
          //   .update(users)
          //   .set({ lastLogin: new Date() })
          //   .where(eq(users.id, user.id));

          console.log("Credentials Auth: Success for", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
           console.error("Credentials Auth Error:", error);
           return null; // Return null on error
        }
      },
    }),
  ],
  callbacks: {
    // Using JWT strategy, the session callback receives the token
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub; // Add id from token to session user
      }
      // You could potentially add other token claims to the session here if needed
      // like session.user.role = token.role;
      return session;
    },
    // The jwt callback is called *before* the session callback
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id; // Persist the user id from the provider/authorize result to the token
        // You could add other details here, e.g., user role if you fetch it
        // token.role = user.role;
      }
      return token; // The token is then passed to the session callback
    },
  },
  session: {
    strategy: "jwt", // Ensure JWT strategy is used if you rely on the jwt callback
  },
  pages: {
    signIn: "/auth/signin", // Your custom sign-in page
    error: "/auth/error",   // Your custom error page
  },
  // Optional: Add debug flag for development
  // debug: process.env.NODE_ENV === 'development',
});