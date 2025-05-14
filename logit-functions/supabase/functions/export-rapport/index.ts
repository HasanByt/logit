import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5'
import ExcelJS from 'https://esm.sh/exceljs'

const supabaseUrl = Deno.env.get('PROJECT_URL')!
const serviceKey = Deno.env.get('SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, serviceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return new Response('Fehlender user_id Parameter', {
        status: 400,
        headers: corsHeaders
      })
    }

    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('rapportgallus') // dein Bucket
      .download('Monatsrapport.xlsx') // deine Datei

    if (fileError || !fileData) {
      return new Response('Vorlage nicht gefunden: ' + fileError?.message, {
        status: 500,
        headers: corsHeaders
      })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await fileData.arrayBuffer())
    const worksheet = workbook.worksheets[0]

    const { data: raports, error: rapportError } = await supabase
      .from('rapporte')
      .select('*')
      .eq('user_id', userId)
      .order('datum', { ascending: true })

    if (rapportError) {
      return new Response('Fehler beim Laden der Rapporte: ' + rapportError.message, {
        status: 500,
        headers: corsHeaders
      })
    }

    // ✅ Neue Logik: Zeile = Objekt, Spalte = Tag (1–31 → B–AF)
    const objekte = Array.from(
      new Map(raports.map(e => [e.objekt, e.objekt])).values()
    )

    objekte.forEach((objekt, index) => {
      const rowIndex = 7 + index // beginnt ab Zeile 7
      const row = worksheet.getRow(rowIndex)
      row.getCell(1).value = objekt // Objektname in Spalte A

      const eintraege = raports.filter(e => e.objekt === objekt)

      eintraege.forEach(entry => {
        const datum = new Date(entry.datum)
        const tag = datum.getDate() // z. B. 13
        const spaltenIndex = 1 + tag // Spalte B = 2 (1+1), C = 3, ...
        row.getCell(spaltenIndex).value = entry.stunden
      })

      row.commit()
    })

    // ✅ Dynamische Spaltenbreite für Spalte A (Objekte)
    const colA = worksheet.getColumn(1)
    let maxLength = 10
    colA.eachCell(cell => {
      const value = cell.value?.toString() || ''
      if (value.length > maxLength) {
        maxLength = value.length
      }
    })
    colA.width = maxLength + 2 // etwas Puffer

    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=Monatsrapport.xlsx',
      }
    })

  } catch (err) {
    const msg = typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
    console.error('Fehler beim Excel-Export:', msg)

    return new Response('Fehler beim Export: ' + msg, {
      status: 500,
      headers: corsHeaders
    })
  }
})
