import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { uploadWaitlistAssetFromServer } from '@/lib/waitlist/blob'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadWaitlistAssetFromServer(buffer, file.name, file.type)

    return NextResponse.json({ url })
  } catch (error: any) {
    const message = error?.message || 'Upload failed'
    const status = error?.name === 'BlobUploadError' ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

