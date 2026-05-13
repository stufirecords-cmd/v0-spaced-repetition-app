'use client'

import { Dashboard } from "@/components/dashboard"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if the URL has error params from Supabase email link (expired OTP, etc.)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const search = window.location.search
      
      if (hash.includes('error') || search.includes('error')) {
        console.log("[v0] Auth error in URL, redirecting to login")
        // Clear the URL params and redirect to login
        window.history.replaceState({}, '', '/')
        router.push('/auth/login')
        return
      }
    }

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

  // Show loading state while checking auth
  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return <Dashboard />
}
