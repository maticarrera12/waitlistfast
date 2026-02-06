export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

export function isAllowedImageType(type: string) {
  return ALLOWED_IMAGE_TYPES.includes(type);
}

