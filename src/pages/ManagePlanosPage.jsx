import { useEffect, useMemo, useState } from 'react'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Dialog, Field, Input, Notice, PageStack, SectionHeader, StatusBadge, SurfacePanel, Textarea, Select, cn } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { createPlano, deletePlano, getPlanos, updatePlano } from '../services/planoService'
import { formatCurrency, isPremiumPlan } from '../utils/billing'

function createEmptyForm() {
  return {
    id: '',
    nome: '',
    descricao: '',
    tipo: '',
    preco: '',
    duracaoDias: '',
    status: 'ATIVO',
  }
}

function normalizePlanoItem(item) {
  return {
    id: String(item?.id || '').trim(),
    nome: String(item?.nome || '').trim(),
    descricao: String(item?.descricao || '').trim(),
    tipo: String(item?.tipo || '').trim(),
    preco: String(item?.preco ?? '').trim(),
    duracaoDias: String(item?.duracaoDias ?? '').trim(),
    abacatePayProductId: String(item?.abacatePayProductId || '').trim(),
    status: item?.status === 1 || item?.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
  }
}

function validateForm(form) {
  const errors = {}
  const nome = form.nome.trim()
  const descricao = form.descricao.trim()
  const tipo = form.tipo.trim()
  const precoTexto = form.preco.toString().trim().replace(',', '.')
  const duracaoTexto = form.duracaoDias.toString().trim()

  if (!nome) errors.nome = 'Informe o nome do plano.'
  if (!descricao) errors.descricao = 'Informe a descrição do plano.'
  if (!tipo) errors.tipo = 'Informe o tipo do plano.'
  if (!precoTexto) {
    errors.preco = 'Informe o preço do plano.'
  } else if (!/^\d+(?:\.\d{1,2})?$/.test(precoTexto) || Number(precoTexto) <= 0) {
    errors.preco = 'O preço deve ser maior que zero e ter no máximo duas casas decimais.'
  }
  if (!duracaoTexto) {
    errors.duracaoDias = 'Informe a duração do plano.'
  } else if (!/^\d+$/.test(duracaoTexto) || Number.parseInt(duracaoTexto, 10) <= 0) {
    errors.duracaoDias = 'A duração deve ser um número inteiro maior que zero.'
  }

  return errors
}

function buildPayload(form) {
  return {
    nome: form.nome.trim(),
    descricao: form.descricao.trim(),
    tipo: form.tipo.trim().toUpperCase(),
    preco: Number(String(form.preco).replace(',', '.')),
    duracaoDias: Number.parseInt(String(form.duracaoDias).trim(), 10),
    status: form.status === 'INATIVO' ? 1 : 0,
  }
}

export function ManagePlanosPage() {
  const toast = useToast()
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState(createEmptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isEditing = Boolean(form.id)
  const planosCount = useMemo(() => planos.length, [planos])

  const loadPlanos = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getPlanos()
      setPlanos(response.map(normalizePlanoItem))
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível carregar os planos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlanos()
  }, [])

  const resetForm = () => {
    setForm(createEmptyForm())
    setFormErrors({})
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleEdit = (plano) => {
    setSuccessMessage('')
    setError('')
    setForm({
      id: plano.id,
      nome: plano.nome,
      descricao: plano.descricao,
      tipo: plano.tipo,
      preco: String(plano.preco ?? ''),
      duracaoDias: String(plano.duracaoDias ?? ''),
      status: plano.status || 'ATIVO',
    })
  }

  const handleToggleStatus = async (plano) => {
    setError('')
    setSuccessMessage('')
    try {
      const nextStatus = plano.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
      const payload = {
        nome: plano.nome,
        descricao: plano.descricao,
        tipo: plano.tipo,
        preco: Number(plano.preco),
        duracaoDias: Number(plano.duracaoDias),
        status: nextStatus === 'INATIVO' ? 1 : 0,
      }
      await updatePlano(plano.id, payload)
      toast.success(`Plano ${nextStatus === 'ATIVO' ? 'ativado' : 'desativado'} com sucesso.`)
      await loadPlanos()
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível alterar status do plano.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateForm(form)
    setFormErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setError('Revise os campos destacados no formulário.')
      return
    }

    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload = buildPayload(form)

      if (form.id) {
        await updatePlano(form.id, payload)
        setSuccessMessage('Plano atualizado com sucesso.')
        toast.success('Plano atualizado com sucesso.')
      } else {
        await createPlano(payload)
        setSuccessMessage('Plano criado com sucesso.')
        toast.success('Plano criado com sucesso.')
      }

      await loadPlanos()
      resetForm()
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível salvar o plano.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccessMessage('')

    try {
      await deletePlano(deleteTarget.id)
      setSuccessMessage('Plano excluído com sucesso.')
      toast.success('Plano excluído com sucesso.')
      setDeleteTarget(null)
      await loadPlanos()
      if (form.id === deleteTarget.id) {
        resetForm()
      }
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível excluir o plano.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          eyebrow="Administração de planos"
          title="Gerencie os planos do AutoHub"
          description="Crie, edite e remova planos usados na contratação com AbacatePay. O fluxo segue o mesmo padrão visual do restante do sistema."
          actions={<Button type="button" variant="secondary" onClick={loadPlanos}>Atualizar</Button>}
        />

        {successMessage ? <Notice variant="success" title="Operação concluída" description={successMessage} /> : null}
        {error ? <Notice variant="error" title="Não foi possível concluir a ação" description={error} /> : null}
        {loading ? <Notice variant="neutral" title="Carregando planos" description="Buscando os dados cadastrados no backend." /> : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <SurfacePanel>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Lista</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">Planos cadastrados</h2>
              </div>
              <StatusBadge tone="neutral" icon="sell">{planosCount} plano(s)</StatusBadge>
            </div>

            {!loading && planos.length === 0 ? (
              <Notice className="mt-6" variant="neutral" title="Nenhum plano cadastrado" description="Use o formulário ao lado para criar o primeiro plano." />
            ) : null}

            <div className="mt-6 grid gap-4">
              {planos.map((plano) => {
                const premium = isPremiumPlan(plano.tipo)

                return (
                  <Card key={plano.id} className={cn('p-5', premium ? 'border-red-200 bg-red-50/30' : '')}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-zinc-950">{plano.nome || 'Plano sem nome'}</h3>
                          {premium ? <StatusBadge tone="done" icon="star">Premium</StatusBadge> : null}
                          {plano.status === 'ATIVO' ? (
                            <StatusBadge tone="done" icon="check_circle">Ativo</StatusBadge>
                          ) : (
                            <StatusBadge tone="neutral" icon="cancel">Inativo</StatusBadge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">{plano.tipo || 'Tipo não informado'}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant={plano.status === 'ATIVO' ? 'subtle' : 'secondary'} onClick={() => handleToggleStatus(plano)}>
                          {plano.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleEdit(plano)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => setDeleteTarget(plano)}>
                          Excluir
                        </Button>
                      </div>
                    </div>

                    {plano.descricao ? <p className="mt-4 text-sm leading-relaxed text-zinc-600">{plano.descricao}</p> : null}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Preço</span>
                        <strong className="mt-1 block text-lg font-black text-zinc-950">{formatCurrency(plano.preco)}</strong>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <span className="block text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Duração</span>
                        <strong className="mt-1 block text-lg font-black text-zinc-950">{plano.duracaoDias || 0} dias</strong>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </SurfacePanel>

          <SurfacePanel>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{isEditing ? 'Edição' : 'Cadastro'}</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950">{isEditing ? 'Editar plano' : 'Novo plano'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">Preencha os campos abaixo com as regras de validação esperadas pelo backend e pelo fluxo de contratação.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Field htmlFor="nome" label="Nome" hint={formErrors.nome}>
                <Input id="nome" name="nome" value={form.nome} onChange={handleChange} aria-invalid={Boolean(formErrors.nome)} required />
              </Field>

              <Field htmlFor="descricao" label="Descrição" hint={formErrors.descricao}>
                <Textarea id="descricao" name="descricao" value={form.descricao} onChange={handleChange} aria-invalid={Boolean(formErrors.descricao)} required />
              </Field>

              <Field htmlFor="tipo" label="Tipo" hint={formErrors.tipo || 'Exemplo: PREMIUM'}>
                <Input id="tipo" name="tipo" value={form.tipo} onChange={handleChange} className="uppercase" aria-invalid={Boolean(formErrors.tipo)} required />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="preco" label="Preço" hint={formErrors.preco}>
                  <Input id="preco" name="preco" type="number" step="0.01" min="0.01" value={form.preco} onChange={handleChange} aria-invalid={Boolean(formErrors.preco)} required />
                </Field>

                <Field htmlFor="duracaoDias" label="Duração em dias" hint={formErrors.duracaoDias}>
                  <Input id="duracaoDias" name="duracaoDias" type="number" step="1" min="1" value={form.duracaoDias} onChange={handleChange} aria-invalid={Boolean(formErrors.duracaoDias)} required />
                </Field>
              </div>

              <Field htmlFor="status" label="Status do Plano" hint="Planos inativos não ficam elegíveis para novas adesões">
                <Select id="status" name="status" value={form.status} onChange={handleChange} required>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </Select>
              </Field>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar plano'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Limpar
                </Button>
              </div>
            </form>
          </SurfacePanel>
        </div>

        <Dialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => (deleting ? null : setDeleteTarget(null))}
          eyebrow="Confirmação de exclusão"
          title={deleteTarget ? `Excluir ${deleteTarget.nome || 'plano'}` : 'Excluir plano'}
          description="A exclusão remove o plano da listagem e impede novas contratações com ele. Essa ação não pode ser desfeita."
          footer={(
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir plano'}
              </Button>
            </div>
          )}
        >
          {deleteTarget ? (
            <div className="space-y-3 text-sm text-zinc-600">
              <p>Plano: <strong className="text-zinc-950">{deleteTarget.nome || 'Sem nome'}</strong></p>
              <p>Tipo: <strong className="text-zinc-950">{deleteTarget.tipo || 'Não informado'}</strong></p>
              <p>Preço: <strong className="text-zinc-950">{formatCurrency(deleteTarget.preco)}</strong></p>
            </div>
          ) : null}
        </Dialog>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default ManagePlanosPage
