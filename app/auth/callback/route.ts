import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Safe block for Server Component rendering context
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Check if user owns an academy record directly
      const { data: academy } = await supabase
        .from('academies')
        .select('id')
        .eq('owner_id', data.user.id)
        .maybeSingle()

      return NextResponse.redirect(`${origin}${academy ? '/dashboard' : '/onboarding'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
}