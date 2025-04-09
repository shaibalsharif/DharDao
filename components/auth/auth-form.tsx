"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from "@/lib/firebase-auth"
import { createOrUpdateUser } from "@/app/actions"

export default function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { toast } = useToast()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        // After successful Firebase auth, create/update user in database
        const deviceInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }

        // Call our server action to handle database operations
        const dbResult = await createOrUpdateUser(
          result.user.uid,
          result.user.email,
          result.user.displayName,
          result.user.photoURL,
          deviceInfo,
          deviceInfo.timeZone,
        )

        if (dbResult.success) {
          toast({
            title: "Sign in successful",
            description: `Welcome, ${result.user.displayName || result.user.email}!`,
          })
        } else {
          console.warn("User authenticated but database update failed:", dbResult.message)
          // Still allow login even if DB update fails
          toast({
            title: "Sign in successful",
            description: `Welcome, ${result.user.displayName || result.user.email}!`,
          })
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error)
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signInWithEmail(email, password)
      if (result.success) {
        // After successful Firebase auth, create/update user in database
        const deviceInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }

        // Call our server action to handle database operations
        await createOrUpdateUser(
          result.user.uid,
          result.user.email,
          result.user.displayName,
          result.user.photoURL,
          deviceInfo,
          deviceInfo.timeZone,
        )

        toast({
          title: "Sign in successful",
          description: `Welcome back!`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error signing in with email:", error)
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signUpWithEmail(email, password, displayName)
      if (result.success) {
        // After successful Firebase auth, create/update user in database
        const deviceInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }

        // Call our server action to handle database operations
        await createOrUpdateUser(
          result.user.uid,
          result.user.email,
          result.user.displayName || displayName,
          result.user.photoURL,
          deviceInfo,
          deviceInfo.timeZone,
        )

        toast({
          title: "Sign up successful",
          description: `Welcome, ${displayName || email}!`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await resetPassword(email)
      if (result.success) {
        toast({
          title: "Password reset email sent",
          description: "Check your email for instructions to reset your password",
        })
        setShowForgotPassword(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button variant="link" onClick={() => setShowForgotPassword(false)} className="w-full">
              Back to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Money Manager</CardTitle>
          <CardDescription>Track your lending and borrowing transactions</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button
                      variant="link"
                      className="px-0 text-xs"
                      onClick={() => setShowForgotPassword(true)}
                      type="button"
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In with Email"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
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
