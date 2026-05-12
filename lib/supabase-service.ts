import { createClient } from '@/lib/supabase/server'
import type { Question } from './types'

export async function getAllUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getUserQuestions(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('date_added', { ascending: false })

  if (error) throw error
  return data
}

export async function getAllQuestionsWithUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('questions')
    .select(
      `
      *,
      profiles:user_id (email)
    `
    )
    .order('date_added', { ascending: false })

  if (error) throw error
  return data
}

export async function addQuestion(
  userId: string,
  question: Omit<Question, 'id' | 'user_id' | 'created_at' | 'updated_at'>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('questions')
    .insert({
      user_id: userId,
      ...question,
    })
    .select()

  if (error) throw error
  return data[0]
}

export async function updateQuestion(
  questionId: string,
  updates: Partial<Question>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()

  if (error) throw error
  return data[0]
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
}

export async function getUserStats(userId: string) {
  const supabase = await createClient()
  const { data: questions, error } = await supabase
    .from('questions')
    .select('difficulty, stability_score')
    .eq('user_id', userId)

  if (error) throw error

  const stats = {
    totalQuestions: questions.length,
    easyCount: questions.filter((q) => q.difficulty === 'Easy').length,
    mediumCount: questions.filter((q) => q.difficulty === 'Medium').length,
    hardCount: questions.filter((q) => q.difficulty === 'Hard').length,
    avgStabilityScore:
      questions.length > 0
        ? (
            questions.reduce((sum, q) => sum + (q.stability_score || 0), 0) /
            questions.length
          ).toFixed(2)
        : 0,
  }

  return stats
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  return user
}

export async function isUserAdmin(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data?.is_admin || false
}
