import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        navigate('/login')
      }
    }

    fetchUser()
  }, [navigate])

  const handleSubmit = async () => {
    if (!name || !password) return alert('Alle Felder ausfüllen.')

    // 1. Name speichern
    const { error: profileError } = await supabase
      .from('benutzer_profile')
      .upsert({ id: userId, name, rolle: 'user' })

    if (profileError) {
      return alert('Fehler beim Speichern des Namens: ' + profileError.message)
    }

    // 2. Passwort ändern
    const { error: pwError } = await supabase.auth.updateUser({ password })

    if (pwError) {
      return alert('Fehler beim Passwort ändern: ' + pwError.message)
    }

    alert('Profil erfolgreich eingerichtet.')
    navigate('/dashboard')
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Profil vervollständigen</h2>
      <input
        type="text"
        placeholder="Name Vorname"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <input
        type="password"
        placeholder="Neues Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <button onClick={handleSubmit}>Speichern</button>
    </div>
  )
}
