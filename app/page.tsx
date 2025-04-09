"use client"

import { useAuth } from "@/contexts/auth-context"
import AuthForm from "@/components/auth/auth-form"
import Dashboard from "@/components/dashboard/dashboard"
import LoadingSpinner from "@/components/ui/loading-spinner"

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <main className="container mx-auto px-4 py-6 h-[100vh] overflow-hidden flex flex-col">
      {loading ? <LoadingSpinner /> : user ? <Dashboard userId={user.uid} /> : <AuthForm />}
    </main>
  )
}
