import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const searchParams = request.nextUrl.searchParams
  const refCode = searchParams.get('ref')

  // Si existe el parámetro ?ref=
  if (refCode) {
    // 1. Guardamos el código en una cookie válida por 30 días
    response.cookies.set('waitlist_ref', refCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      httpOnly: true, // Seguridad
      sameSite: 'lax'
    })

    // 2. (Opcional) Limpiamos la URL para que se vea bonita
    // Esto es "Nice to have", para el MVP puedes dejar la URL sucia si prefieres
    // const url = request.nextUrl.clone()
    // url.searchParams.delete('ref')
    // return NextResponse.redirect(url, { headers: response.headers })
  }

  return response
}

export const config = {
  // Aplicar solo en las rutas públicas de waitlists
  matcher: '/w/:path*',
}

