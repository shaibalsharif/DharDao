import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from '@paralleldrive/cuid2';
import { logActivity } from "@/lib/db-utils";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Fallback to nodemailer with a free SMTP service
const nodemailerTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return NextResponse.json(
        { message: "If your email is registered, you will receive a password reset link" },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = createId();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Update user with reset token
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
      })
      .where(eq(users.id, user.id));

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // Email content
    const subject = "Reset Your Money Manager Password";
    const text = `Hello ${user.name || "there"},\n\nYou requested to reset your password. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nMoney Manager Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Money Manager Password</h2>
        <p>Hello ${user.name || "there"},</p>
        <p>You requested to reset your password. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Regards,<br>Money Manager Team</p>
      </div>
    `;

    // Send email using Resend if available, otherwise use nodemailer
    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: email,
        subject,
        text,
        html,
      });
    } else {
      await nodemailerTransport.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        text,
        html,
      });
    }

    // Log activity
    await logActivity({
      userId: user.id,
      type: "auth",
      action: "password_reset_request",
      details: "User requested password reset",
      timestamp: new Date(),
    });

    return NextResponse.json(
      { message: "If your email is registered, you will receive a password reset link" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}