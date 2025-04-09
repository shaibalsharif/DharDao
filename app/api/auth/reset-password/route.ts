import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import bcrypt from 'bcryptjs';
import { logActivity } from "@/lib/db-utils";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Find user with valid token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.resetToken, token),
        gte(users.resetTokenExpiry!, new Date())
      ),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    // Log activity
    await logActivity({
      userId: user.id,
      type: "auth",
      action: "password_reset",
      details: "User reset their password",
      timestamp: new Date(),
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reset password:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}