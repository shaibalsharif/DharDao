import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from 'bcryptjs';
import { logActivity } from "@/lib/db-utils";
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = createId();
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        lastLogin: new Date(),
      })
      .returning({ id: users.id });

    // Log activity
    await logActivity({
      userId: user.id,
      type: "auth",
      action: "signup",
      details: "User created account with email/password",
      timestamp: new Date(),
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the user" },
      { status: 500 }
    );
  }
}