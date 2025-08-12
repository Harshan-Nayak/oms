import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createMiddlewareClient({ req: request, res: response })

    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession()

    return response
  } catch {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
