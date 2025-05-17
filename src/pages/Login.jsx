import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError(null)

    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError('❌ ' + loginError.message)
      return
    }

    const user = authData.user
    if (!user) {
      setError('❌ Benutzer nicht gefunden')
      return
    }

    // Benutzerrolle abrufen aus benutzer_profile
    const { data: profile, error: profileError } = await supabase
      .from('benutzer_profile')
      .select('rolle')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      setError('❌ Rolle konnte nicht geladen werden')
      return
    }

    // 🔀 Weiterleiten basierend auf Rolle
    if (profile.rolle === 'admin') {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <button onClick={handleLogin} style={{ width: '100%' }}>
        Login
      </button>
      {error && <p style={{ marginTop: '1rem', color: 'red' }}>{error}</p>}
    </div>
  )
}
