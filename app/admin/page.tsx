import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  // Fetch all users
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })

  // Fetch all questions
  const { data: questions } = await supabase
    .from("questions")
    .select(
      `
      id,
      user_id,
      title,
      url,
      difficulty,
      tags,
      date_added,
      stability_score,
      interval_days,
      next_revision_date,
      profiles:user_id(email)
    `,
    )
    .order("date_added", { ascending: false })

  return (
    <AdminDashboard
      users={users || []}
      questions={questions || []}
      adminEmail={user.email}
    />
  )
}
