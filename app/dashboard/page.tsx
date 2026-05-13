'use client'

import { Dashboard } from "@/components/dashboard"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setIsLoggedIn(true)
        } else {
          setIsLoggedIn(false)
          router.push('/auth/login')
        }
      } catch (err) {
        console.log("[v0] Auth check error:", err)
        setIsLoggedIn(false)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return <Dashboard />
}
