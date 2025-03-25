"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { createUserIfNotExists } from "@/lib/firebase-utils"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Create user in Firestore if they don't exist
        try {
          await createUserIfNotExists(user)
        } catch (error) {
          console.error("Error creating user:", error)
        }
      }

      setUser(user)
      setLoading(false)
      console.log("Auth state changed:", user ? "User logged in" : "No user")
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

