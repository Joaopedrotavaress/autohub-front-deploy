export const WORKSHOP_IMAGE_LIMIT = 5
export const WORKSHOP_IMAGE_MAX_SIZE = 5 * 1024 * 1024
export const WORKSHOP_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function createImagePreview(file) {
  return file ? URL.createObjectURL(file) : ''
}

export function revokeImagePreview(previewUrl) {
  if (previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl)
  }
}

export function validateWorkshopImageFiles(files, currentCount = 0) {
  const selectedFiles = Array.from(files || [])

  if (currentCount + selectedFiles.length > WORKSHOP_IMAGE_LIMIT) {
    return {
      valid: false,
      files: [],
      message: `Selecione no máximo ${WORKSHOP_IMAGE_LIMIT} imagens para a oficina.`,
    }
  }

  const invalidType = selectedFiles.find((file) => !WORKSHOP_IMAGE_TYPES.includes(file.type))
  if (invalidType) {
    return {
      valid: false,
      files: [],
      message: 'Formato inválido. Use JPG, JPEG, PNG ou WebP.',
    }
  }

  const oversized = selectedFiles.find((file) => file.size > WORKSHOP_IMAGE_MAX_SIZE)
  if (oversized) {
    return {
      valid: false,
      files: [],
      message: 'Imagem muito grande. O tamanho máximo permitido é 5MB.',
    }
  }

  return { valid: true, files: selectedFiles, message: '' }
}

export default {
  WORKSHOP_IMAGE_LIMIT,
  WORKSHOP_IMAGE_MAX_SIZE,
  WORKSHOP_IMAGE_TYPES,
  createImagePreview,
  revokeImagePreview,
  validateWorkshopImageFiles,
}
