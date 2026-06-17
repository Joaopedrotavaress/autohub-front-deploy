import { useRef } from 'react'
import { Button } from '../ui'
import { WORKSHOP_IMAGE_LIMIT, WORKSHOP_IMAGE_TYPES } from '../../services/uploadService'

export function WorkshopImageUpload({
  existingImages = [],
  selectedImages = [],
  loading = false,
  error = '',
  title = 'Imagens da oficina',
  description = `JPG, JPEG, PNG ou WebP. Até ${WORKSHOP_IMAGE_LIMIT} imagens, 5MB cada.`,
  emptyLabel = 'Nenhuma imagem selecionada',
  existingImageAlt = 'Imagem cadastrada',
  selectedImageAlt = 'Preview da imagem selecionada',
  onSelect,
  onRemoveExisting,
  onRemoveSelected,
}) {
  const inputRef = useRef(null)
  const totalImages = existingImages.length + selectedImages.length
  const isLimitReached = totalImages >= WORKSHOP_IMAGE_LIMIT

  const handleChange = (event) => {
    onSelect?.(event.target.files)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <label
          htmlFor="oficina-imagens"
          className={[
            'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50',
            (loading || isLimitReached) ? 'pointer-events-none opacity-60' : '',
          ].join(' ')}
        >
          <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
          Selecionar
        </label>
        <input
          ref={inputRef}
          id="oficina-imagens"
          type="file"
          multiple
          accept={WORKSHOP_IMAGE_TYPES.join(',')}
          onChange={handleChange}
          disabled={loading || isLimitReached}
          className="sr-only"
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <span>{totalImages}/{WORKSHOP_IMAGE_LIMIT} imagens selecionadas</span>
        {loading ? <span>Enviando imagens...</span> : null}
      </div>

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      {totalImages > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {existingImages.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img src={url} alt={existingImageAlt} className="h-full w-full object-cover" />
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={loading}
                onClick={() => onRemoveExisting?.(url)}
                className="absolute right-2 top-2 h-9 w-9 rounded-full p-0"
                aria-label="Remover imagem cadastrada"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </Button>
            </div>
          ))}

          {selectedImages.map((image) => (
            <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img src={image.previewUrl} alt={selectedImageAlt} className="h-full w-full object-cover" />
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={loading}
                onClick={() => onRemoveSelected?.(image.id)}
                className="absolute right-2 top-2 h-9 w-9 rounded-full p-0"
                aria-label="Remover imagem selecionada"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
          {emptyLabel}
        </div>
      )}
    </div>
  )
}

export default WorkshopImageUpload
