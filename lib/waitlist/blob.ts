import { put } from '@vercel/blob'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']

export class BlobUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlobUploadError'
  }
}

function getFileType(contentType: string): 'image' | 'video' {
  if (ALLOWED_IMAGE_TYPES.includes(contentType)) return 'image'
  if (ALLOWED_VIDEO_TYPES.includes(contentType)) return 'video'
  throw new BlobUploadError(`Unsupported file type: ${contentType}. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM.`)
}

function validateFileSize(size: number, type: 'image' | 'video') {
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
  const maxLabel = type === 'image' ? '5 MB' : '50 MB'
  if (size > maxSize) {
    throw new BlobUploadError(`File too large. Max size for ${type}s is ${maxLabel}.`)
  }
}

export async function uploadWaitlistAsset(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new BlobUploadError('No file provided.')
  }

  const fileType = getFileType(file.type)
  validateFileSize(file.size, fileType)

  const ext = file.name.split('.').pop() || fileType === 'image' ? 'jpg' : 'mp4'
  const filename = `waitlist/${fileType}s/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: false,
  })

  return blob.url
}

export async function uploadWaitlistAssetFromServer(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const fileType = getFileType(contentType)
  validateFileSize(buffer.length, fileType)

  const ext = filename.split('.').pop() || (fileType === 'image' ? 'jpg' : 'mp4')
  const blobFilename = `waitlist/${fileType}s/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const blob = await put(blobFilename, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
  })

  return blob.url
}

