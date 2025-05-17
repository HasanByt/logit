import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import ExcelExport from '../components/ExcelExport'


export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [rolle, setRolle] = useState(null)
  const [benutzername, setBenutzername] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeMonth, setActiveMonth] = useState(new Date())
  const [objekt, setObjekt] = useState('')
  const [stunden, setStunden] = useState('')
  const [rapportTage, setRapportTage] = useState([])
  const [rapporteListe, setRapporteListe] = useState([])
  const navigate = useNavigate()

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return navigate('/login')
      setUser(user)

      const { data: profile } = await supabase
        .from('benutzer_profile')
        .select('name, rolle')
        .eq('id', user.id)
        .single()

      if (!profile?.name) return navigate('/onboarding')

      setBenutzername(profile.name)
      setRolle(profile.rolle || 'user')
    }

    fetchUser()
  }, [navigate])

  useEffect(() => {
    if (!user || !activeMonth) return

    const ladeRapporte = async () => {
      const start = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1)
      const ende = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('rapporte')
        .select('*')
        .eq('user_id', user.id)
        .gte('datum', formatDate(start))
        .lte('datum', formatDate(ende))
        .order('datum', { ascending: true })

      if (!error && data) {
        setRapporteListe(data)
        const tage = data.map(e => new Date(e.datum).toDateString())
        setRapportTage(tage)
      }
    }

    ladeRapporte()
  }, [user, activeMonth])

  const handleSave = async () => {
    if (!objekt || !stunden) return alert('Bitte alle Felder ausfüllen.')

    const { error } = await supabase.from('rapporte').insert({
      user_id: user.id,
      datum: formatDate(selectedDate),
      objekt,
      stunden: parseFloat(stunden)
    })

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
    } else {
      alert('Eintrag gespeichert.')
      setObjekt('')
      setStunden('')
      setActiveMonth(new Date(selectedDate))
    }
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('rapporte').delete().eq('id', id)
    if (!error) {
      setRapporteListe(prev => prev.filter(r => r.id !== id))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user || rolle === null) return <p>Lade...</p>

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: '2rem' }}>
      <h2>Willkommen bei Logit!</h2>
      <p>Angemeldet als: <strong>{benutzername}</strong></p>
      <button onClick={handleLogout}>Logout</button>
      <hr />

      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        locale="de-DE"
        tileClassName={({ date }) =>
          rapportTage.includes(date.toDateString()) ? 'highlight' : null
        }
        onActiveStartDateChange={({ activeStartDate }) => {
          setActiveMonth(activeStartDate)
        }}
      />

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
      <ExcelExport user={user} activeMonth={activeMonth} />

      <hr />
      <h3>Gespeichert für {activeMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
      {rapporteListe.map(e => {
        const tag = new Date(e.datum).getDay()
        let background = '#F5F5F5' // normal
        if (tag === 6) background = '#DBEEF4' // Samstag
        else if (tag === 0) background = '#C6D9F1' // Sonntag

        return (
          <div
            key={e.id}
            style={{
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background,
              borderRadius: '5px'
            }}
          >
            <strong>{e.datum}</strong>: {e.objekt} – {e.stunden} Std.
            <button
              onClick={() => handleDelete(e.id)}
              style={{ marginLeft: '1rem', background: 'salmon' }}
            >
              Löschen
            </button>
          </div>
        )
      })}
    </div>
  )
}
