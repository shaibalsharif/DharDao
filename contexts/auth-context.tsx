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
          // Get user device and location information
          const userAgent = navigator.userAgent
          const deviceInfo = {
            userAgent,
            browser: getBrowserInfo(userAgent),
            os: getOSInfo(userAgent),
            device: getDeviceInfo(userAgent),
            language: navigator.language,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }

          // Get approximate location based on timezone
          const locationInfo = getLocationFromTimezone(deviceInfo.timeZone)

          await createUserIfNotExists(user, deviceInfo, locationInfo)
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

  // Helper functions to extract device information
  function getBrowserInfo(userAgent: string) {
    const browsers = [
      { name: "Chrome", pattern: /Chrome\/(\d+)/ },
      { name: "Firefox", pattern: /Firefox\/(\d+)/ },
      { name: "Safari", pattern: /Safari\/(\d+)/ },
      { name: "Edge", pattern: /Edg(e)?\/(\d+)/ },
      { name: "Opera", pattern: /Opera|OPR\/(\d+)/ },
      { name: "IE", pattern: /MSIE|Trident/ },
    ]

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern)
      if (match) {
        return `${browser.name} ${match[1] || ""}`.trim()
      }
    }

    return "Unknown Browser"
  }

  function getOSInfo(userAgent: string) {
    const os = [
      { name: "Windows", pattern: /Windows NT (\d+\.\d+)/ },
      { name: "Mac", pattern: /Mac OS X (\d+[._]\d+)/ },
      { name: "iOS", pattern: /iPhone OS (\d+)/ },
      { name: "Android", pattern: /Android (\d+)/ },
      { name: "Linux", pattern: /Linux/ },
    ]

    for (const system of os) {
      const match = userAgent.match(system.pattern)
      if (match) {
        return `${system.name} ${match[1] || ""}`.trim().replace("_", ".")
      }
    }

    return "Unknown OS"
  }

  function getDeviceInfo(userAgent: string) {
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return "iOS Device"
    } else if (/Android/.test(userAgent)) {
      return "Android Device"
    } else if (/Windows Phone/.test(userAgent)) {
      return "Windows Phone"
    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
      return "Mac"
    } else if (/Windows|Win32|Win64|Windows NT/.test(userAgent)) {
      return "Windows"
    } else if (/Linux/.test(userAgent)) {
      return "Linux"
    }

    return "Unknown Device"
  }

  function getLocationFromTimezone(timezone: string) {
    // Simple mapping of common timezones to locations
    const timezoneMap: Record<string, string> = {
      "America/New_York": "Eastern United States",
      "America/Chicago": "Central United States",
      "America/Denver": "Mountain United States",
      "America/Los_Angeles": "Western United States",
      "Europe/London": "United Kingdom",
      "Europe/Paris": "France",
      "Europe/Berlin": "Germany",
      "Asia/Tokyo": "Japan",
      "Asia/Shanghai": "China",
      "Asia/Kolkata": "India",
      "Australia/Sydney": "Eastern Australia",
      // Add more mappings as needed
    }

    // Extract region from timezone
    const region = timezone.split("/")[0]

    return timezoneMap[timezone] || region || "Unknown Location"
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

