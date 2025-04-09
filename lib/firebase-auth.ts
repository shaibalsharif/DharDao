"use client"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { auth } from "./firebase"

// Google Sign In
export async function signInWithGoogle() {
  try {
    // Set persistence to LOCAL - this ensures the user stays logged in
    await setPersistence(auth, browserLocalPersistence)

    const provider = new GoogleAuthProvider()
    // Add scopes for additional permissions if needed
    provider.addScope("profile")
    provider.addScope("email")

    // Set custom parameters for the Google sign-in flow
    provider.setCustomParameters({
      prompt: "select_account",
    })

    const result = await signInWithPopup(auth, provider)

    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const token = credential ? credential.accessToken : null

    return {
      success: true,
      user: result.user,
      token,
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error)
    return {
      success: false,
      error: error.message || "Failed to sign in with Google",
    }
  }
}

// Email/Password Sign Up
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)

    // Update profile with display name
    await updateProfile(result.user, { displayName })

    return {
      success: true,
      user: result.user,
    }
  } catch (error: any) {
    console.error("Error signing up with email:", error)
    return {
      success: false,
      error: error.message || "Failed to sign up",
    }
  }
}

// Email/Password Sign In
export async function signInWithEmail(email: string, password: string) {
  try {
    // Set persistence to LOCAL - this ensures the user stays logged in
    await setPersistence(auth, browserLocalPersistence)

    const result = await signInWithEmailAndPassword(auth, email, password)
    return {
      success: true,
      user: result.user,
    }
  } catch (error: any) {
    console.error("Error signing in with email:", error)
    return {
      success: false,
      error: error.message || "Invalid email or password",
    }
  }
}

// Password Reset
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error: any) {
    console.error("Error resetting password:", error)
    return {
      success: false,
      error: error.message || "Failed to send password reset email",
    }
  }
}

// Sign Out
export async function signOut() {
  try {
    await auth.signOut()
    return { success: true }
  } catch (error: any) {
    console.error("Error signing out:", error)
    return {
      success: false,
      error: error.message || "Failed to sign out",
    }
  }
}
