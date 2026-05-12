'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Mail, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface UserData {
  id: string
  email: string
  is_admin: boolean
  created_at: string
  questions_count: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Check if current user is admin
      const { data: { user: currentUserData } } = await supabase.auth.getUser()
      
      if (!currentUserData) {
        router.push('/auth/login')
        return
      }

      setCurrentUser(currentUserData)

      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')

      if (profilesData) {
        // For each profile, count their questions
        const usersWithCounts = await Promise.all(
          profilesData.map(async (profile) => {
            const { count } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id)

            return {
              id: profile.id,
              email: profile.email,
              is_admin: profile.is_admin,
              created_at: profile.created_at,
              questions_count: count || 0,
            }
          })
        )

        setUsers(usersWithCounts)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">All Users</h1>
              <p className="text-gray-600">View all registered users and their data</p>
            </div>
          </div>
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm">
              <strong>Logged in as:</strong> {currentUser.email}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Questions Added</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Admin</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        <Plus className="w-4 h-4" />
                        {user.questions_count}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Questions</p>
            <p className="text-3xl font-bold text-gray-900">
              {users.reduce((sum, u) => sum + u.questions_count, 0)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Admin Users</p>
            <p className="text-3xl font-bold text-gray-900">
              {users.filter(u => u.is_admin).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
