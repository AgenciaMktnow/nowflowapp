import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type User = {
  id: string
  full_name: string
  avatar_url?: string | null
  team?: string | null
}

export function useUsers() {

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {

    const fetchUsers = async () => {

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, team')
        .order('full_name')

      if (error) {
        console.error(error)
        return
      }

      if (data) setUsers(data)

    }

    fetchUsers()

  }, [])

  return users
}