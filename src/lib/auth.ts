import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await dbConnect();
      const existingUser = await User.findOne({ email: user.email });
      
      if (!existingUser) {
        await User.create({
          email: user.email,
          name: user.name,
          image: user.image,
        });
      }
      return true;
    },

    async session({ session }) {
      await dbConnect();
      const dbUser = await User.findOne({ email: session.user?.email });
      
      if (dbUser) {
        // @ts-ignore
        session.user.id = dbUser._id.toString();
        // @ts-ignore
        session.user.elo = dbUser.progression.elo;
        // @ts-ignore
        session.user.rank = dbUser.progression.rank;
        // @ts-ignore
        session.user.xp = dbUser.progression.xp;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};