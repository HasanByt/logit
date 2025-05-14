import { supabase } from '../supabaseClient'

export default function ExcelExport({ user }) {
  const handleDownload = async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!user || !token) {
      alert('Nicht eingeloggt')
      return
    }

    const response = await fetch(
      `https://wmvjdrpuepkwztsnmqew.supabase.co/functions/v1/export-rapport?user_id=${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      alert('Fehler beim Herunterladen des Rapports.')
      return
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'Monatsrapport.xlsx'
    a.click()
    a.remove()
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <button onClick={handleDownload}>Rapport herunterladen</button>
    </div>
  )
}
