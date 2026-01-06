// Supabase Edge Function: process-recurring
// Processes recurring financial entries and updates overdue entries
// Should be triggered daily via cron job

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessResult {
  created_entries: number
  updated_overdue: number
  errors: string[]
}

interface RecurringTemplate {
  id: string
  branch_id: string
  type: 'receita' | 'despesa'
  description: string
  value: number
  due_date: string
  category_id: string | null
  subcategory_id: string | null
  favorecido_id: string | null
  bank_account_id: string | null
  notes: string | null
  document_number: string | null
  created_by: string | null
  recurrence_type: 'diario' | 'semanal' | 'mensal' | 'anual'
  recurrence_day: number | null
  recurrence_end_date: string | null
}

function calculateNextOccurrence(
  baseDate: Date,
  recurrenceType: string,
  recurrenceDay: number | null,
  occurrenceNumber: number
): Date {
  const result = new Date(baseDate)
  
  switch (recurrenceType) {
    case 'diario':
      result.setDate(result.getDate() + occurrenceNumber)
      break
    case 'semanal':
      result.setDate(result.getDate() + (occurrenceNumber * 7))
      break
    case 'mensal':
      result.setMonth(result.getMonth() + occurrenceNumber)
      // Adjust to the specified day of the month if provided
      if (recurrenceDay !== null) {
        const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
        result.setDate(Math.min(recurrenceDay, lastDayOfMonth))
      }
      break
    case 'anual':
      result.setFullYear(result.getFullYear() + occurrenceNumber)
      break
  }
  
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const result: ProcessResult = {
      created_entries: 0,
      updated_overdue: 0,
      errors: [],
    }

    const today = new Date()
    const todayStr = formatDate(today)
    
    // Calculate max date (12 months ahead)
    const maxDate = new Date(today)
    maxDate.setMonth(maxDate.getMonth() + 12)
    const maxDateStr = formatDate(maxDate)

    console.log(`Processing recurring entries from ${todayStr} to ${maxDateStr}`)

    // Step 1: Fetch all recurring templates
    const { data: templates, error: templatesError } = await supabase
      .from('financial_entries')
      .select('*')
      .eq('is_recurring_template', true)
      .eq('is_recurring', true)
      .not('recurrence_type', 'is', null)

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`)
    }

    console.log(`Found ${templates?.length || 0} recurring templates`)

    // Step 2: Process each template
    for (const template of (templates as RecurringTemplate[] || [])) {
      try {
        // Determine end date
        let endDate = maxDate
        if (template.recurrence_end_date) {
          const templateEndDate = new Date(template.recurrence_end_date)
          if (templateEndDate < endDate) {
            endDate = templateEndDate
          }
        }

        const baseDate = new Date(template.due_date)
        let occurrenceNum = 1

        // Generate occurrences
        while (occurrenceNum <= 500) { // Safety limit
          const occurrenceDate = calculateNextOccurrence(
            baseDate,
            template.recurrence_type,
            template.recurrence_day,
            occurrenceNum
          )

          if (occurrenceDate > endDate) {
            break
          }

          // Only create entries for future dates
          if (occurrenceDate >= today) {
            const occurrenceDateStr = formatDate(occurrenceDate)

            // Check if this occurrence already exists
            const { data: existing } = await supabase
              .from('financial_entries')
              .select('id')
              .eq('recurring_parent_id', template.id)
              .eq('due_date', occurrenceDateStr)
              .limit(1)

            if (!existing || existing.length === 0) {
              // Create new entry
              const { error: insertError } = await supabase
                .from('financial_entries')
                .insert({
                  branch_id: template.branch_id,
                  type: template.type,
                  description: template.description,
                  value: template.value,
                  due_date: occurrenceDateStr,
                  category_id: template.category_id,
                  subcategory_id: template.subcategory_id,
                  favorecido_id: template.favorecido_id,
                  bank_account_id: template.bank_account_id,
                  status: 'pendente',
                  notes: template.notes,
                  document_number: template.document_number,
                  created_by: template.created_by,
                  is_recurring: true,
                  recurrence_type: template.recurrence_type,
                  recurrence_day: template.recurrence_day,
                  recurring_parent_id: template.id,
                  is_recurring_template: false,
                })

              if (insertError) {
                result.errors.push(`Failed to create entry for template ${template.id}: ${insertError.message}`)
              } else {
                result.created_entries++
              }
            }
          }

          occurrenceNum++
        }
      } catch (templateError) {
        result.errors.push(`Error processing template ${template.id}: ${(templateError as Error).message}`)
      }
    }

    // Step 3: Update overdue entries
    const { data: overdueUpdated, error: overdueError } = await supabase
      .from('financial_entries')
      .update({ status: 'atrasado' })
      .eq('status', 'pendente')
      .eq('is_recurring_template', false)
      .lt('due_date', todayStr)
      .select('id')

    if (overdueError) {
      result.errors.push(`Failed to update overdue entries: ${overdueError.message}`)
    } else {
      result.updated_overdue = overdueUpdated?.length || 0
    }

    console.log(`Completed: created ${result.created_entries} entries, updated ${result.updated_overdue} overdue`)
    if (result.errors.length > 0) {
      console.warn('Errors:', result.errors)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recurring entries processed successfully',
        data: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing recurring entries:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: (error as Error).message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
