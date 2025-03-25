"use client"

import { useState } from "react"
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

export default function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const signInWithGoogle = async () => {
    setIsLoading(true)
    try {
      // Set persistence to LOCAL - this ensures the user stays logged in
      await setPersistence(auth, browserLocalPersistence)

      // Then sign in with popup
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      console.log("Sign in successful:", result.user.displayName)

      toast({
        title: "Sign in successful",
        description: `Welcome, ${result.user.displayName}!`,
      })
    } catch (error: any) {
      console.error("Error signing in with Google:", error)

      let errorMessage = "Failed to sign in with Google. Please try again."

      if (error.code === "auth/configuration-not-found") {
        errorMessage =
          "Authentication configuration not found. Please make sure Google sign-in is enabled in Firebase console."
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Sign-in popup was blocked by your browser. Please allow popups for this site."
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in popup was closed before authentication was completed."
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Money Manager</CardTitle>
          <CardDescription>Track your lending and borrowing transactions</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 gap-6">
            <Button onClick={signInWithGoogle} disabled={isLoading} className="w-full">
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

