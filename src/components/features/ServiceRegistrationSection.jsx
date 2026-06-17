import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { useOficinaContext } from '../../context/OficinaContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, Field, Input, Notice, PageStack, SectionHeader, Select, Textarea, getButtonClasses } from '../ui'
import { WorkshopImageUpload } from '../common'
import { getAllOficinas } from '../../services/oficinaViewService'
import { createServico } from '../../services/servicoService'
import { createImagePreview, revokeImagePreview, validateWorkshopImageFiles } from '../../services/uploadService'
import { getUserRole, ROLES } from '../../utils/accessControl'
import { normalizeOficina } from '../../utils/oficina'

const STATUS_OPTIONS = ['PREVENCAO', 'MANUTENCAO', 'ESTETICA']
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

const STATUS_LABELS = {
  PREVENCAO: 'Prevenção',
  MANUTENCAO: 'Manutenção',
  ESTETICA: 'Estética',
}

function isAuthorizedUser(user) {
  const role = getUserRole(user)
  return role === ROLES.ADMIN || role === ROLES.DONO_OFICINA
}

function getUserId(user) {
  return String(user?.id ?? user?.Id ?? '').trim()
}

function getOficinaId(oficina) {
  return String(oficina?.id ?? oficina?.Id ?? '').trim()
}

function getOfficeName(oficina) {
  return String(oficina?.nome ?? oficina?.Nome ?? 'Oficina sem nome').trim()
}

function normalizeGuid(value) {
  return String(value ?? '').trim()
}

function parseCurrencyToDecimal(value) {
  if (typeof value !== 'string') return NaN
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  if (!normalized.trim()) return NaN
  return Number.parseFloat(normalized)
}

function formatCurrencyInput(value) {
  if (!value) return ''
  const normalized = value.replace(/\D/g, '')
  if (!normalized) return ''
  const cents = Number.parseInt(normalized, 10)
  const decimalValue = cents / 100
  return decimalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isValidGuid(value) {
  if (!value) return false
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return guidRegex.test(value)
}

export function ServiceRegistrationSection({ initialOficinaId = '' }) {
  const navigate = useNavigate()
  const { user } = useAppContext()
  const { oficinas: oficinasProfissionais, oficinaAtiva, setOficinaAtiva } = useOficinaContext()
  const toast = useToast()
  const userRole = getUserRole(user)
  const userId = getUserId(user)
  const isAdmin = userRole === ROLES.ADMIN
  const isDonoOficina = userRole === ROLES.DONO_OFICINA

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    precoInput: '',
    status: 'PREVENCAO',
    oficinaId: initialOficinaId,
  })
  const [loadingOficinas, setLoadingOficinas] = useState(false)
  const [oficinas, setOficinas] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [imageError, setImageError] = useState('')
  const selectedImagesRef = useRef([])

  const canCreateServico = useMemo(() => isAuthorizedUser(user), [user])

  useEffect(() => {
    let cancelled = false

    const fetchOficinas = async () => {
      setLoadingOficinas(true)
      try {
        const result = isDonoOficina ? oficinasProfissionais : await getAllOficinas()
        if (cancelled) return
        const listaOficinas = (Array.isArray(result) ? result : []).map(normalizeOficina)
        setOficinas(listaOficinas)

        if (initialOficinaId) {
          setForm((prev) => ({ ...prev, oficinaId: normalizeGuid(initialOficinaId) }))
          if (isDonoOficina) {
            setOficinaAtiva(normalizeGuid(initialOficinaId))
          }
          return
        }

        if (isDonoOficina) {
          const oficinaId = getOficinaId(oficinaAtiva || listaOficinas[0])
          if (oficinaId) {
            setForm((prev) => ({ ...prev, oficinaId }))
          }

          return
        }

        if (isAdmin && listaOficinas.length === 1) {
          setForm((prev) => ({ ...prev, oficinaId: getOficinaId(listaOficinas[0]) }))
        }
      } catch (err) {
        if (!cancelled) {
          setOficinas([])
        }
      } finally {
        if (!cancelled) {
          setLoadingOficinas(false)
        }
      }
    }

    fetchOficinas()

    return () => {
      cancelled = true
    }
  }, [initialOficinaId, isAdmin, isDonoOficina, userId, oficinaAtiva?.id, oficinasProfissionais])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  useEffect(() => () => {
    selectedImagesRef.current.forEach((image) => revokeImagePreview(image.previewUrl))
  }, [])

  const clearSelectedImages = () => {
    setSelectedImages((current) => {
      current.forEach((image) => revokeImagePreview(image.previewUrl))
      return []
    })
  }

  const handleSelectImages = (files) => {
    const validation = validateWorkshopImageFiles(files, selectedImages.length)
    if (!validation.valid) {
      setImageError(validation.message)
      toast.error(validation.message)
      return
    }

    const selectedKeys = new Set(selectedImages.map((image) => image.fileKey))
    const uniqueFiles = validation.files.filter((file) => {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`
      return !selectedKeys.has(fileKey)
    })

    if (uniqueFiles.length !== validation.files.length) {
      toast.warning('Imagem duplicada ignorada na seleção.')
    }

    const nextImages = uniqueFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
      fileKey: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      previewUrl: createImagePreview(file),
    }))

    setSelectedImages((current) => [...current, ...nextImages])
    setImageError('')
  }

  const handleRemoveSelectedImage = (imageId) => {
    setSelectedImages((current) => {
      const image = current.find((item) => item.id === imageId)
      if (image) revokeImagePreview(image.previewUrl)
      return current.filter((item) => item.id !== imageId)
    })
    setImageError('')
  }

  const handlePriceInput = (event) => {
    const formattedValue = formatCurrencyInput(event.target.value)
    setForm((prev) => ({ ...prev, precoInput: formattedValue }))
  }

  const validateForm = () => {
    if (!canCreateServico) {
      toast.error('Você não tem permissão para cadastrar serviços.')
      return false
    }

    if (!form.nome.trim()) {
      toast.warning('Informe o nome do serviço.')
      return false
    }

    if (!form.descricao.trim()) {
      toast.warning('Informe a descrição do serviço.')
      return false
    }

    if (!STATUS_OPTIONS.includes(form.status)) {
      toast.warning('Selecione um tipo válido para o serviço.')
      return false
    }

    if (!form.oficinaId || !form.oficinaId.trim()) {
      toast.warning(isDonoOficina ? 'Sua oficina vinculada não foi encontrada.' : 'Selecione uma oficina para continuar.')
      return false
    }

    if (!isValidGuid(form.oficinaId) || form.oficinaId === EMPTY_GUID) {
      toast.error('A oficina selecionada é inválida. Recarregue a página e tente novamente.')
      return false
    }

    const precoDecimal = parseCurrencyToDecimal(form.precoInput)
    if (!Number.isFinite(precoDecimal) || precoDecimal <= 0) {
      toast.warning('Informe um preço maior que zero.')
      return false
    }

    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        preco: parseCurrencyToDecimal(form.precoInput),
        status: form.status,
        oficinaId: normalizeGuid(form.oficinaId),
        imagens: selectedImages.map((image) => image.file),
      }

      const servicoCriado = await createServico(payload)
      toast.success(`Serviço cadastrado com sucesso: ${servicoCriado?.nome || payload.nome}.`)

      setForm((prev) => ({
        ...prev,
        nome: '',
        descricao: '',
        precoInput: '',
        status: 'PREVENCAO',
      }))
      clearSelectedImages()
      setImageError('')
    } catch (err) {
      if (err?.status === 400) {
        toast.error('Existem dados inválidos. Revise os campos e tente novamente.')
      } else if (err?.status === 404) {
        toast.error('A oficina informada não foi encontrada.')
      } else if (err?.status === 401 || err?.status === 403) {
        toast.error('Você não tem permissão para cadastrar serviços.')
      } else {
        toast.error(err?.message || 'Não foi possível cadastrar o serviço.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageStack maxWidth="max-w-5xl">
        <SectionHeader
          description="Cadastre um novo serviço vinculado a uma oficina para acompanhamento do progresso do veículo."
          eyebrow="Gestão de serviços"
          title="Cadastrar Serviço"
        />

        {!canCreateServico && (
          <Notice
            description="Esta ação é permitida apenas para ADMIN e DONO_OFICINA."
            title="Você não tem permissão para cadastrar serviços"
            variant="error"
          />
        )}

        <Card className="p-5 md:p-6">
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="nome" label="Nome do serviço">
                <Input
                  id="nome"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex.: Troca de óleo completa"
                  disabled={loading || !canCreateServico}
                  required
                />
              </Field>

              <Field htmlFor="preco" label="Preço">
                <Input
                  id="preco"
                  name="preco"
                  value={form.precoInput}
                  onChange={handlePriceInput}
                  placeholder="0,00"
                  disabled={loading || !canCreateServico}
                  inputMode="numeric"
                  required
                />
              </Field>

              <Field htmlFor="status" label="Tipo do serviço">
                <Select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={loading || !canCreateServico}
                  required
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              </Field>

              {isAdmin && oficinas.length > 0 && (
                <Field htmlFor="oficinaId" label="Oficina">
                  <Select
                    id="oficinaId"
                    name="oficinaId"
                    value={form.oficinaId}
                    onChange={handleChange}
                    disabled={loading || !canCreateServico || loadingOficinas}
                    required
                  >
                    <option value="">Selecione uma oficina</option>
                    {oficinas.map((oficina) => {
                      const oficinaId = getOficinaId(oficina)
                      return (
                        <option key={oficinaId} value={oficinaId}>
                          {getOfficeName(oficina)}
                        </option>
                      )
                    })}
                  </Select>
                </Field>
              )}

              {isDonoOficina && oficinas.length > 1 && (
                <Field htmlFor="oficinaId" label="Oficina ativa">
                  <Select
                    id="oficinaId"
                    name="oficinaId"
                    value={form.oficinaId}
                    onChange={(event) => {
                      handleChange(event)
                      setOficinaAtiva(event.target.value)
                    }}
                    disabled={loading || !canCreateServico || loadingOficinas}
                    required
                  >
                    <option value="">Selecione uma oficina</option>
                    {oficinas.map((oficina) => {
                      const oficinaId = getOficinaId(oficina)
                      return (
                        <option key={oficinaId} value={oficinaId}>
                          {getOfficeName(oficina)}
                        </option>
                      )
                    })}
                  </Select>
                </Field>
              )}

              <Field className="md:col-span-2" htmlFor="descricao" label="Descrição do serviço">
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Descreva o serviço realizado no veículo"
                  disabled={loading || !canCreateServico}
                  required
                />
              </Field>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <WorkshopImageUpload
                selectedImages={selectedImages}
                loading={loading}
                error={imageError}
                title="Imagens do serviço"
                emptyLabel="Nenhuma imagem de serviço selecionada"
                existingImageAlt="Imagem cadastrada do serviço"
                selectedImageAlt="Preview da imagem do serviço"
                onSelect={handleSelectImages}
                onRemoveSelected={handleRemoveSelectedImage}
              />
            </div>

            {oficinas.length === 0 && !loadingOficinas && isAdmin && (
              <Notice title="Nenhuma oficina encontrada" variant="warning">
                <span>Nenhuma oficina foi encontrada. </span>
                <Link className="font-bold text-red-700 underline underline-offset-4" to="/workshops">Ver oficinas</Link>
              </Notice>
            )}

            {isDonoOficina && !form.oficinaId && !loadingOficinas && (
              <Notice title="Nenhuma oficina vinculada" variant="warning">
                <span>Nenhuma oficina foi encontrada para o usuário logado. </span>
                <Link className="font-bold text-red-700 underline underline-offset-4" to="/register/oficina">Cadastrar minha oficina</Link>
              </Notice>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={loading || !canCreateServico}>
                {loading ? 'Cadastrando...' : 'Cadastrar Serviço'}
              </Button>

              <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={loading}>
                Voltar
              </Button>
            </div>
          </form>
        </Card>
    </PageStack>
  )
}

export default ServiceRegistrationSection
