import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function RequireAuth({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        setUser(null)
      } else {
        setUser(data.user)
      }
      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) return <p>Lade...</p>

  return user ? children : <Navigate to="/login" />
}
