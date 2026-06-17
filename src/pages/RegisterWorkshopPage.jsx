import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { WorkshopImageUpload } from '../components/common'
import { Button, Card, Field, Input, Notice, Textarea, getButtonClasses } from '../components/ui'
import { useAppContext } from '../context/AppContext'
import { useOficinaContext } from '../context/OficinaContext'
import { useToast } from '../context/ToastContext'
import { lookupCep, geocodeWorkshopAddress } from '../services/geocodingService'
import { createOficina } from '../services/oficinaService'
import { getMinhaOficinaPrivada, getOficinaById, updateOficina } from '../services/oficinaViewService'
import { createImagePreview, revokeImagePreview, validateWorkshopImageFiles } from '../services/uploadService'
import { getUserRole, ROLES } from '../utils/accessControl'
import {
  formatBrazilianPhone,
  hasValidCoordinates,
  isValidBrazilianMobilePhone,
  normalizeCoordinates,
  normalizeOficina,
  serializeWorkshopImageUrls,
} from '../utils/oficina'

function createEmptyForm() {
  return {
    nome: '',
    cep: '',
    endereco: '',
    cnpj: '',
    telefone: '',
    descricao: '',
    latitude: null,
    longitude: null,
  }
}

function normalizeCepValue(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8)
}

function buildFormFromWorkshop(oficina) {
  const normalized = normalizeOficina(oficina)

  return {
    ...createEmptyForm(),
    ...normalized,
    cep: normalizeCepValue(normalized.cep),
  }
}

function getCepFromWorkshop(oficina) {
  return normalizeCepValue(normalizeOficina(oficina).cep)
}

function buildFormWithCepFallback(oficina, fallbacks = []) {
  const nextForm = buildFormFromWorkshop(oficina)
  const fallbackCep = [nextForm.cep, ...fallbacks.map(getCepFromWorkshop)].find(Boolean) || ''

  return {
    ...nextForm,
    cep: normalizeCepValue(fallbackCep),
  }
}

function buildSavedWorkshopForm(oficina, payload) {
  return buildFormWithCepFallback(oficina, [{ cep: payload?.cep }])
}

function getSuccessPath(userRole, oficinaId) {
  if ((userRole === ROLES.DONO_OFICINA || userRole === ROLES.ADMIN) && oficinaId) {
    return `/servico/cadastrar/${oficinaId}`
  }

  return '/register/oficina'
}

export function RegisterWorkshopPage() {
  const { user } = useAppContext()
  const { oficinas, refreshOficinas, loading: loadingOficinasContext, error: officeContextError } = useOficinaContext()
  const { uid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const userRole = getUserRole(user)
  const routeUid = String(uid || '').trim()
  const isEditing = Boolean(routeUid)
  const routeStateOficina = location.state?.oficina || null

  const [form, setForm] = useState(createEmptyForm)
  const [oficinaAtual, setOficinaAtual] = useState(null)
  const [loadingOficina, setLoadingOficina] = useState(isEditing)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [existingImageUrls, setExistingImageUrls] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [imageError, setImageError] = useState('')
  const selectedImagesRef = useRef([])
  const cepRequestRef = useRef(0)

  const isOnboarding = searchParams.get('onboarding') === '1'

  const clearSelectedImages = () => {
    setSelectedImages((current) => {
      current.forEach((image) => revokeImagePreview(image.previewUrl))
      return []
    })
  }

  useEffect(() => {
    let cancelled = false

    const loadOficina = async () => {
      if (!isEditing) {
        setOficinaAtual(null)
        setForm(createEmptyForm())
        setExistingImageUrls([])
        clearSelectedImages()
        setImageError('')
        setLoadingOficina(false)
        return
      }

      setLoadingOficina(true)

      try {
        const oficina = await getMinhaOficinaPrivada(routeUid)

        if (cancelled) {
          return
        }

        const contextOficina = oficinas.find((item) => item.id === routeUid)
        const immediateForm = buildFormWithCepFallback(oficina, [routeStateOficina, contextOficina])
        let publicOficina = null

        if (!immediateForm.cep) {
          publicOficina = await getOficinaById(routeUid).catch(() => null)
        }

        if (cancelled) {
          return
        }

        const nextForm = buildFormWithCepFallback(oficina, [routeStateOficina, contextOficina, publicOficina])
        const normalized = {
          ...normalizeOficina(oficina),
          cep: nextForm.cep,
        }

        setOficinaAtual(normalized)
        setForm(nextForm)
        setExistingImageUrls(normalized.imagensUrls)
        clearSelectedImages()
        setImageError('')
      } catch (err) {
        if (cancelled) {
          return
        }

        setOficinaAtual(null)
        setForm(createEmptyForm())
        setExistingImageUrls([])
        clearSelectedImages()
        setImageError('')
        toast.error(err.message || 'Nao foi possivel carregar a oficina informada na URL.')
      } finally {
        if (!cancelled) {
          setLoadingOficina(false)
        }
      }
    }

    loadOficina()

    return () => {
      cancelled = true
    }
  }, [isEditing, routeUid, oficinas, routeStateOficina])

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  useEffect(() => () => {
    selectedImagesRef.current.forEach((image) => revokeImagePreview(image.previewUrl))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: name === 'telefone'
        ? formatBrazilianPhone(value)
        : name === 'cep'
          ? normalizeCepValue(value)
          : value,
    }))
  }

  const handleSelectImages = (files) => {
    const validation = validateWorkshopImageFiles(files, existingImageUrls.length + selectedImages.length)
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

  const handleRemoveExistingImage = (imageUrl) => {
    setExistingImageUrls((current) => current.filter((url) => url !== imageUrl))
    setImageError('')
  }

  const fetchAddressByCEP = async (cep) => {
    const normalizedCep = normalizeCepValue(cep)
    if (normalizedCep.length !== 8) {
      toast.warning('Informe um CEP valido com 8 digitos.')
      return
    }

    const requestId = Date.now()
    cepRequestRef.current = requestId
    setCepLoading(true)

    try {
      const cepData = await lookupCep(normalizedCep)
      const nextAddress = cepData.endereco || ''

      if (cepRequestRef.current !== requestId) {
        return
      }

      setForm((current) => ({
        ...current,
        cep: normalizeCepValue(cepData.cep || normalizedCep),
        endereco: nextAddress,
      }))

      try {
        const geocoded = await geocodeWorkshopAddress({ endereco: nextAddress, cep: cepData.cep || normalizedCep })

        if (cepRequestRef.current !== requestId) {
          return
        }

        setForm((current) => ({
          ...current,
          cep: normalizeCepValue(cepData.cep || normalizedCep),
          endereco: nextAddress,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        }))
        toast.success('CEP encontrado e endereco preenchido com sucesso.')
      } catch {
        setForm((current) => ({
          ...current,
          cep: normalizeCepValue(cepData.cep || normalizedCep),
          endereco: nextAddress,
          latitude: null,
          longitude: null,
        }))
        toast.warning('CEP encontrado, mas nao foi possivel obter as coordenadas agora.')
      }
    } catch (error) {
      toast.error(error.message || 'Não foi possível buscar o CEP.')
    } finally {
      if (cepRequestRef.current === requestId) {
        setCepLoading(false)
      }
    }
  }

  const validateForm = () => {
    if (!user?.id) {
      toast.error('E necessario estar autenticado para gerenciar suas oficinas.')
      return false
    }

    if (!form.nome.trim()) { toast.warning('Nome da oficina é obrigatório.'); return false }
    if (!normalizeCepValue(form.cep)) { toast.warning('CEP da oficina é obrigatório.'); return false }
    if (normalizeCepValue(form.cep).length !== 8) { toast.warning('Informe um CEP valido com 8 digitos.'); return false }
    if (!form.endereco.trim()) { toast.warning('Endereço da oficina é obrigatório.'); return false }
    if (!form.cnpj.trim()) { toast.warning('CNPJ da oficina é obrigatório.'); return false }
    if (!form.telefone.trim()) { toast.warning('Telefone da oficina é obrigatório.'); return false }
    if (!isValidBrazilianMobilePhone(form.telefone)) { toast.warning('Informe um celular válido com DDD.'); return false }
    if (!form.descricao.trim()) { toast.warning('Descrição da oficina é obrigatória.'); return false }

    return true
  }

  const resolveCoordinates = async () => {
    if (hasValidCoordinates(form.latitude, form.longitude)) {
      return normalizeCoordinates(form.latitude, form.longitude)
    }

    return geocodeWorkshopAddress({ endereco: form.endereco, cep: form.cep })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    try {
      const coordinates = await resolveCoordinates()
      const imagens = selectedImages.map((image) => image.file)
      const payload = {
        nome: form.nome.trim(),
        cep: normalizeCepValue(form.cep),
        endereco: form.endereco.trim(),
        cnpj: form.cnpj.trim(),
        telefone: form.telefone.trim(),
        descricao: form.descricao.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        imagemUrl: serializeWorkshopImageUrls(existingImageUrls),
      }

      if (isEditing) {
        const oficina = await updateOficina(routeUid, payload, imagens)
        const normalized = normalizeOficina(oficina)

        setOficinaAtual(normalized)
        setForm(buildSavedWorkshopForm(oficina, payload))
        setExistingImageUrls(normalized.imagensUrls)
        clearSelectedImages()
        await refreshOficinas()
        toast.success(`Oficina atualizada com sucesso: ${normalized.nome || payload.nome}.`)
        return
      }

      const oficina = await createOficina(payload, imagens)
      const normalized = normalizeOficina(oficina)

      setOficinaAtual(normalized)
      setForm(buildSavedWorkshopForm(oficina, payload))
      setExistingImageUrls(normalized.imagensUrls)
      clearSelectedImages()
      await refreshOficinas()

      toast.success(`Oficina cadastrada com sucesso: ${normalized.nome || payload.nome}.`)

      if (normalized.id) {
        navigate(getSuccessPath(userRole, normalized.id))
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar a oficina. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="grid w-full grid-cols-1 gap-8 ">
        <Card className="p-8 md:col-span-2">
          <header className="mb-6">
            <h1 className="text-4xl font-extrabold text-slate-900">
              {isEditing ? 'Editar oficina' : 'Cadastrar oficina'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isOnboarding
                ? 'Finalize seu onboarding profissional com uma oficina valida e coordenadas reais.'
                : 'Preencha os dados da oficina e mantenha as informacoes sincronizadas com o backend.'}
            </p>
          </header>

          {(loadingOficinasContext || officeContextError) && (
            <Notice
              className="mb-6"
              description={loadingOficinasContext ? 'Sincronizando oficinas do usuário autenticado...' : officeContextError}
              title={loadingOficinasContext ? 'Sincronizando oficinas' : 'Não foi possível atualizar a lista de oficinas'}
              variant={loadingOficinasContext ? 'neutral' : 'error'}
            />
          )}

          {loadingOficina && (
            <Notice className="mb-6" description="Carregando os dados da oficina informada na URL..." title="Buscando oficina" />
          )}

          {!loadingOficina && isEditing && oficinaAtual?.id && (
            <Notice
              className="mb-6"
              description="Os dados foram carregados a partir do uid presente na URL."
              title="Oficina carregada"
              variant="success"
            />
          )}

          {!loadingOficina && !isEditing && (
            <Notice
              className="mb-6"
              description="Preencha os dados abaixo para cadastrar uma nova oficina."
              title="Nova oficina"
              variant="warning"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="rounded-3xl p-6 shadow-none">
              <h3 className="mb-4 text-sm font-bold text-slate-800">Dados principais</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field htmlFor="nome" label="Nome">
                  <Input
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    placeholder="Atelie Mecanico Premium"
                  />
                </Field>

                <Field htmlFor="cnpj" label="CNPJ">
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    required
                    placeholder="00.000.000/0001-00"
                  />
                </Field>

                <Field className="md:col-span-2" htmlFor="cep" label="CEP">
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      name="cep"
                      value={form.cep}
                      onChange={handleChange}
                      onBlur={() => form.cep && fetchAddressByCEP(form.cep)}
                      disabled={cepLoading}
                      className="flex-1"
                      placeholder="00000000"
                    />
                    <Button
                      type="button"
                      onClick={() => form.cep && fetchAddressByCEP(form.cep)}
                      disabled={cepLoading || !form.cep}
                      variant="secondary"
                    >
                      {cepLoading ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                </Field>

                <Field className="md:col-span-2" htmlFor="endereco" label="Endereço">
                  <Input
                    id="endereco"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    required
                    placeholder="Av. Brasil, 1000 - Belo Horizonte"
                  />
                </Field>

                <Field htmlFor="telefone" label="Celular">
                  <Input
                    id="telefone"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    required
                    inputMode="tel"
                    maxLength={15}
                    placeholder="(31) 99999-9999"
                  />
                </Field>

                <Field className="md:col-span-2" htmlFor="descricao" label="Descrição">
                  <Textarea
                    id="descricao"
                    name="descricao"
                    value={form.descricao}
                    onChange={handleChange}
                    required
                    placeholder="Especializada em manutencao premium e diagnosticos avancados."
                  />
                </Field>
              </div>
            </Card>

            <Card className="rounded-3xl p-6 shadow-none">
              <WorkshopImageUpload
                existingImages={existingImageUrls}
                selectedImages={selectedImages}
                loading={loading}
                error={imageError}
                onSelect={handleSelectImages}
                onRemoveExisting={handleRemoveExistingImage}
                onRemoveSelected={handleRemoveSelectedImage}
              />
            </Card>

            <div className="flex items-center gap-6">
              <Button type="submit" disabled={loading} fullWidth size="lg">
                {loading ? (selectedImages.length > 0 ? 'Enviando imagens...' : isEditing ? 'Salvando...' : 'Cadastrando...') : isEditing ? 'Salvar alteracoes' : 'Cadastrar oficina'}
              </Button>

              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Voltar</Button>
            </div>

            {oficinaAtual?.id && (userRole === ROLES.DONO_OFICINA || userRole === ROLES.ADMIN) && (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/servico/cadastrar/${oficinaAtual.id}`}
                  className={getButtonClasses({ variant: 'subtle' })}
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_add</span>
                  Cadastrar servicos desta oficina
                </Link>
              </div>
            )}
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}

export default RegisterWorkshopPage
