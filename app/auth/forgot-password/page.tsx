"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process request");
      }
      
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Request failed",
        description: error.message || "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a password reset link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              If you don't see the email in your inbox, please check your spam folder.
            </p>
            <p className="text-sm text-muted-foreground">
              The link will expire in 1 hour.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/signin">
              <Button variant="outline">Back to Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}