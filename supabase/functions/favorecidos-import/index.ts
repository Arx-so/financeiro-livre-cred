import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportResult {
  branch_id: string
  branch_name: string
  total_rows: number
  inserted: number
  skipped_duplicate: number
  skipped_empty_name: number
  errors: { row: number; name: string; reason: string }[]
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  // Take only the first phone if multiple are separated by / or ,
  const first = String(raw).split(/[\/,]/)[0].trim()
  return first || null
}

function normalizeDocument(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = String(raw).replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
  }
  // Return as-is if already formatted or unknown format
  return String(raw).trim() || null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse multipart form
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const branchCode = (formData.get('branch_code') as string | null)?.trim().toUpperCase()

    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing "file" field' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!branchCode) {
      return new Response(JSON.stringify({ error: 'Missing "branch_code" field' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Resolve branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('code', branchCode)
      .single()

    if (branchError || !branch) {
      return new Response(JSON.stringify({ error: `Branch with code "${branchCode}" not found` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse XLSX
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })

    // Fetch existing documents in this branch to detect duplicates
    const { data: existingRaw } = await supabase
      .from('favorecidos')
      .select('document, name')
      .eq('branch_id', branch.id)

    const existingDocuments = new Set(
      (existingRaw ?? [])
        .filter((r) => r.document)
        .map((r) => String(r.document).replace(/\D/g, '')),
    )
    const existingNames = new Set(
      (existingRaw ?? [])
        .map((r) => String(r.name).toLowerCase().trim()),
    )

    const result: ImportResult = {
      branch_id: branch.id,
      branch_name: branch.name,
      total_rows: rows.length,
      inserted: 0,
      skipped_duplicate: 0,
      skipped_empty_name: 0,
      errors: [],
    }

    const BATCH_SIZE = 50
    const toInsert: Record<string, unknown>[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 because row 1 is header

      const name = String(row['Nome'] ?? '').trim()
      if (!name) {
        result.skipped_empty_name++
        continue
      }

      const rawDocument = row['CPF'] ?? row['CNPJ'] ?? null
      const document = normalizeDocument(String(rawDocument ?? ''))
      const documentDigits = document ? document.replace(/\D/g, '') : null

      // Duplicate check: by document (if present) or by name
      if (documentDigits && existingDocuments.has(documentDigits)) {
        result.skipped_duplicate++
        continue
      }
      if (!documentDigits && existingNames.has(name.toLowerCase())) {
        result.skipped_duplicate++
        continue
      }

      const phone = normalizePhone(String(row['Telefones'] ?? ''))
      const cartao = row['Cartão'] ?? row['Cartao'] ?? null
      const noteParts: string[] = []
      if (cartao) noteParts.push(`Cartão: ${cartao}`)

      toInsert.push({
        branch_id: branch.id,
        type: 'cliente',
        name,
        document: document || null,
        phone: phone || null,
        notes: noteParts.length > 0 ? noteParts.join(' | ') : null,
        is_active: true,
      })

      // Mark as seen so within-batch duplicates are also caught
      if (documentDigits) existingDocuments.add(documentDigits)
      else existingNames.add(name.toLowerCase())
    }

    // Insert in batches
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase.from('favorecidos').insert(batch)
      if (insertError) {
        result.errors.push({
          row: i + 2,
          name: String(batch[0]?.name ?? ''),
          reason: insertError.message,
        })
      } else {
        result.inserted += batch.length
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
