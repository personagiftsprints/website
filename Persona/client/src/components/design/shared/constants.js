export const FONTS = [
  { label: 'Sans', value: 'font-sans' },
  { label: 'Serif', value: 'font-serif' },
  { label: 'Mono', value: 'font-mono' },
  { label: 'Display', value: 'font-bold' }
]

export const DESIGN_TYPES = [
  { id: 'image', label: 'Image' },
  { id: 'text', label: 'Text' }
]

export const UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: 'image/*',
  formats: ['JPG', 'PNG', 'GIF']
}