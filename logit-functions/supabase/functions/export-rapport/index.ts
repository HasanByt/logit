// ============================
// 📁 index.ts (Edge Function)
// ============================

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
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '')

    if (!userId || isNaN(year) || isNaN(month)) {
      return new Response('Fehlender oder ungültiger Parameter', {
        status: 400,
        headers: corsHeaders
      })
    }

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('rapportgallus')
      .download('Monatsrapport.xlsx')

    if (fileError || !fileData) {
      return new Response('Vorlage nicht gefunden: ' + fileError?.message, {
        status: 500,
        headers: corsHeaders
      })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await fileData.arrayBuffer())
    const worksheet = workbook.worksheets[0]

    worksheet.getCell('Q3').value = `${start.toLocaleString('de-DE', {
      month: 'long',
    })}`

    worksheet.getCell('Z3').value = `${start.toLocaleString('de-DE', {
      year: 'numeric',
    })}`

    const { data: raports, error: rapportError } = await supabase
      .from('rapporte')
      .select('*')
      .eq('user_id', userId)
      .gte('datum', startStr)
      .lte('datum', endStr)
      .order('datum', { ascending: true })

    if (rapportError) {
      return new Response('Fehler beim Laden der Rapporte: ' + rapportError.message, {
        status: 500,
        headers: corsHeaders
      })
    }

    const { data: profileData, error: profileError } = await supabase
      .from('benutzer_profile')
      .select('name')
      .eq('id', userId)
      .single()

    if (profileError || !profileData?.name) {
      return new Response('Benutzername konnte nicht geladen werden.', {
        status: 500,
        headers: corsHeaders
      })
    }

    worksheet.getCell('T1').value = profileData.name

    const objekte = Array.from(new Set(raports.map(e => e.objekt)))

    let totalStunden = 0

    objekte.forEach((objekt, index) => {
      const rowIndex = 6 + index
      const row = worksheet.getRow(rowIndex)
      row.getCell(1).value = objekt

      raports.filter(e => e.objekt === objekt).forEach(entry => {
        const datum = new Date(entry.datum)
        const tag = datum.getDate()
        const colIndex = 1 + tag
        const cell = row.getCell(colIndex)
        const value = parseFloat(entry.stunden)
        if (!isNaN(value)) {
          cell.value = value
          cell.numFmt = '0.00'
          totalStunden += value
        }
      })

      row.commit()
    })

    worksheet.getCell('AE26').value = totalStunden
    worksheet.getCell('AE26').numFmt = '0.00'

    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Monatsrapport_${month}_${year}.xlsx`,
      }
    })
  } catch (err) {
    const msg = typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
    return new Response('Fehler beim Export: ' + msg, {
      status: 500,
      headers: corsHeaders
    })
  }
})
