import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function RapportListe({ user, selectedDate }) {
  const [eintraege, setEintraege] = useState([])

  const ladeEintraege = async () => {
    if (!user || !selectedDate) return

    const jahr = selectedDate.getFullYear()
    const monat = selectedDate.getMonth()

    const ersterTag = new Date(jahr, monat, 1)
    const letzterTag = new Date(jahr, monat + 1, 0)

    const { data, error } = await supabase
      .from('rapporte')
      .select('*')
      .eq('user_id', user.id)
      .gte('datum', ersterTag.toISOString().split('T')[0])
      .lte('datum', letzterTag.toISOString().split('T')[0])
      .order('datum', { ascending: true })

    if (!error) {
      setEintraege(data)
    }
  }

  useEffect(() => {
    ladeEintraege()
  }, [user, selectedDate])

  const loescheEintrag = async (id) => {
    const { error } = await supabase.from('rapporte').delete().eq('id', id)
    if (!error) {
      setEintraege(prev => prev.filter(e => e.id !== id))
    } else {
      alert('Fehler beim Löschen: ' + error.message)
    }
  }

  if (!eintraege.length) return <p>Keine Einträge für diesen Monat.</p>

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Einträge für {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {eintraege.map(entry => (
          <li key={entry.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
            <strong>{entry.datum}</strong>: {entry.objekt} – {entry.stunden} Std.
            <button
              onClick={() => loescheEintrag(entry.id)}
              style={{ marginLeft: '1rem', color: 'red' }}
            >
              Löschen
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
