// 📁 ExcelExport.jsx
import { supabase } from '../supabaseClient'

export default function ExcelExport({ user, activeMonth }) {
  const handleDownload = async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!user || !token || !activeMonth) {
      alert('Nicht eingeloggt oder kein Monat ausgewählt')
      return
    }

    const year = activeMonth.getFullYear()
    const month = activeMonth.getMonth() + 1 // JS: 0-based, API: 1-based

    console.log('Exportiere für:', { userId: user.id, year, month })

    const response = await fetch(
      `https://wmvjdrpuepkwztsnmqew.supabase.co/functions/v1/export-rapport?user_id=${user.id}&year=${year}&month=${month}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const err = await response.text()
      alert('Fehler beim Herunterladen: ' + err)
      return
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `Monatsrapport_${month}_${year}.xlsx`
    a.click()
    a.remove()
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <button onClick={handleDownload}>Rapport herunterladen</button>
    </div>
  )
}
