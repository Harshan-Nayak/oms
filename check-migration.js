import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xicadkstvpskvvdohvme.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpY2Fka3N0dnBza3Z2ZG9odm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk4NDQxMywiZXhwIjoyMDcwNTYwNDEzfQ.BFvO_bKCg4pe-xmUN0zX2lP-6dx_VhxPkK_IT2igedk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Starting migration...')

    // Step 1: Add GST fields to expenses table
    console.log('Adding GST fields...')
    
    // Step 2: Check if columns already exist
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'expenses')
      .eq('table_schema', 'public')

    console.log('Current expense columns:', columns?.map(c => c.column_name))

    // Let's test by fetching an expense record to see current structure
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1)
      .single()

    if (expenseError) {
      console.error('Error fetching expense:', expenseError)
    } else {
      console.log('Sample expense record:', expense)
      console.log('Fields available:', Object.keys(expense))
    }

    console.log('Migration check completed!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Run with: node check-migration.js
runMigration()