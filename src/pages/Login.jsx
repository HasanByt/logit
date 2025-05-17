import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import logitLogo from '../assets/logit-logo.png' // ← dein Logo-Pfad

export default function Login() {
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passwort,
    })

    if (error) {
      alert('Login fehlgeschlagen: ' + error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: '2rem' }}>
      <img
        src={logitLogo}
        alt="Logit Logo"
        style={{
          width: '250px',
          display: 'block',
          margin: '0 auto 1rem auto'
        }}
      />
      <h2 style={{ textAlign: 'center' }}>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">Login</button>
      </form>
    </div>
  )
}
