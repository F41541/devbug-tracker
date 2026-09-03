import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const defaultEmail = process.env.SEED_ADMIN_EMAIL || 'admin@devbug.io'
const defaultPassword = process.env.SEED_ADMIN_PASSWORD || '123456'

async function seedUser() {
  console.log(`\n--- SEEDING ADMIN USER ---`)
  console.log(`Target Email: ${defaultEmail}`)

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Failed to list users:', listError.message)
    process.exit(1)
  }

  const existingUser = usersData.users.find((u) => u.email === defaultEmail)

  if (existingUser) {
    console.log(`User ${defaultEmail} found (ID: ${existingUser.id}). Updating password & confirming email...`)
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: defaultPassword,
      email_confirm: true,
    })

    if (updateError) {
      console.error('Failed to update password:', updateError.message)
      process.exit(1)
    }

    console.log(`Admin user successfully updated!`)
  } else {
    console.log(`Creating new admin user...`)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: defaultEmail,
      password: defaultPassword,
      email_confirm: true,
    })

    if (createError) {
      console.error('Failed to create user:', createError.message)
      process.exit(1)
    }

    console.log(`Admin user created successfully with ID: ${newUser.user.id}`)
  }

  console.log('\n=========================================')
  console.log('SEED ADMIN USER COMPLETED!')
  console.log(`Email    : ${defaultEmail}`)
  console.log(`Password : ${defaultPassword}`)
  console.log('=========================================\n')
}

seedUser().catch((err) => {
  console.error('Unexpected seeding error:', err)
  process.exit(1)
})
