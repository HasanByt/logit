import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import RapportCalendar from '../components/Calendar'
import ExcelExport from '../components/ExcelExport'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [objekt, setObjekt] = useState('')
  const [stunden, setStunden] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        navigate('/login')
      } else {
        setUser(user)
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSave = async () => {
    if (!objekt || !stunden) return alert('Bitte alle Felder ausfüllen.')

    const { error } = await supabase.from('rapporte').insert({
      user_id: user.id,
      datum: selectedDate.toISOString().split('T')[0],
      objekt,
      stunden: parseFloat(stunden)
    })

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      alert('Eintrag gespeichert.')
      setObjekt('')
      setStunden('')
    }
  }

  if (!user) return <p>Lade Benutzerdaten...</p>

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: '2rem' }}>
      <h2>Willkommen bei Logit!</h2>
      <p>Angemeldet als: <strong>{user.email}</strong></p>
      <button onClick={handleLogout}>Logout</button>
      <hr />

      <RapportCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <h3>Rapporteintrag für: {selectedDate.toLocaleDateString()}</h3>
      <input
        type="text"
        placeholder="Objekt"
        value={objekt}
        onChange={(e) => setObjekt(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <input
        type="number"
        placeholder="Stunden"
        value={stunden}
        onChange={(e) => setStunden(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <button onClick={handleSave}>Speichern</button>
      <ExcelExport user={user} />
    </div>
  )
}
