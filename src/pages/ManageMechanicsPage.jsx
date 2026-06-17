import { useEffect, useMemo, useState } from 'react'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Field, Input, Notice, PageStack, SectionHeader, SurfacePanel } from '../components/ui'
import { useOficinaContext } from '../context/OficinaContext'
import { createMecanico, getMecanicos, removeMecanicoVinculo, updateMecanico } from '../services/usuarioService'

function createEmptyForm() {
  return {
    id: '',
    nome: '',
    email: '',
    senhaInicial: '',
    oficinasIds: [],
  }
}

function normalizeMechanic(item) {
  return {
    id: String(item?.id || '').trim(),
    nome: String(item?.nome || '').trim(),
    email: String(item?.email || '').trim(),
    oficinasIds: Array.isArray(item?.oficinasIds) ? item.oficinasIds.map((value) => String(value || '').trim()).filter(Boolean) : [],
  }
}

export function ManageMechanicsPage() {
  const { oficinas, refreshOficinas } = useOficinaContext()
  const [mecanicos, setMecanicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(createEmptyForm)

  const officeNamesById = useMemo(() => {
    return new Map(oficinas.map((oficina) => [oficina.id, oficina.nome || 'Oficina sem nome']))
  }, [oficinas])

  const loadPage = async () => {
    setLoading(true)
    setError('')

    try {
      await refreshOficinas()
      const response = await getMecanicos()
      setMecanicos((Array.isArray(response) ? response : []).map(normalizeMechanic))
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar os mecanicos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [])

  const resetForm = () => {
    setForm(createEmptyForm())
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleOfficeToggle = (officeId) => {
    setForm((current) => {
      const exists = current.oficinasIds.includes(officeId)
      return {
        ...current,
        oficinasIds: exists
          ? current.oficinasIds.filter((value) => value !== officeId)
          : [...current.oficinasIds, officeId],
      }
    })
  }

  const handleEdit = (mecanico) => {
    setForm({
      id: mecanico.id,
      nome: mecanico.nome,
      email: mecanico.email,
      senhaInicial: '',
      oficinasIds: mecanico.oficinasIds,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        senhaInicial: form.senhaInicial,
        oficinasIds: form.oficinasIds,
      }

      if (form.id) {
        await updateMecanico(form.id, payload)
      } else {
        await createMecanico(payload)
      }

      await loadPage()
      resetForm()
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel salvar o mecanico.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLink = async (mecanicoId, oficinaId) => {
    setSaving(true)
    setError('')

    try {
      await removeMecanicoVinculo(mecanicoId, oficinaId)
      await loadPage()
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel remover o vinculo do mecanico.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <PageStack>
        <SectionHeader
          description="Cadastre mecânicos, defina a senha inicial e controle exatamente em quais oficinas cada profissional pode atuar."
          eyebrow="Equipe mecânica"
          title="Gestão de mecânicos"
        />

        {error && !loading ? <Notice variant="error" title="Não foi possível concluir a operação" description={error} /> : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SurfacePanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Gestão</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">Mecânicos cadastrados</h2>
            </div>
            <Button type="button" variant="secondary" onClick={loadPage}>
              Atualizar
            </Button>
          </div>

          {loading ? <p className="mt-6 text-sm text-zinc-600">Carregando equipe...</p> : null}
          {!loading && !error && mecanicos.length === 0 ? <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">Nenhum mecânico cadastrado ainda.</p> : null}

          <div className="mt-6 space-y-4">
            {mecanicos.map((mecanico) => (
              <article key={mecanico.id} className="rounded-[1.75rem] border border-zinc-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-zinc-950">{mecanico.nome}</h3>
                    <p className="text-sm text-zinc-600">{mecanico.email}</p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(mecanico)}>
                    Editar
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {mecanico.oficinasIds.length === 0 ? <span className="text-sm text-zinc-500">Sem oficinas vinculadas.</span> : null}
                  {mecanico.oficinasIds.map((officeId) => (
                    <span key={officeId} className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-700">
                      <span>{officeNamesById.get(officeId) || 'Oficina vinculada'}</span>
                      <button type="button" className="text-red-600" onClick={() => handleRemoveLink(mecanico.id, officeId)}>
                        remover
                      </button>
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SurfacePanel>

        <SurfacePanel>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{form.id ? 'Edição' : 'Cadastro'}</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">{form.id ? 'Atualizar mecânico' : 'Novo mecânico'}</h2>
          <p className="mt-2 text-sm text-zinc-600">O mecânico não faz auto cadastro. O acesso inicial é criado aqui pelo dono da oficina.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field htmlFor="nome" label="Nome">
              <Input id="nome" name="nome" value={form.nome} onChange={handleChange} required />
            </Field>

            <Field htmlFor="email" label="Email">
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </Field>

            <Field htmlFor="senhaInicial" label="Senha inicial">
              <Input id="senhaInicial" name="senhaInicial" type="password" value={form.senhaInicial} onChange={handleChange} placeholder={form.id ? 'Preencha apenas para redefinir' : 'Minimo 6 caracteres'} required={!form.id} />
            </Field>

            <fieldset>
              <legend className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Oficinas vinculadas</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {oficinas.map((oficina) => {
                  const checked = form.oficinasIds.includes(oficina.id)
                  return (
                    <label key={oficina.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 ${checked ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-white'}`}>
                      <input type="checkbox" checked={checked} onChange={() => handleOfficeToggle(oficina.id)} className="mt-1" />
                      <span>
                        <strong className="block text-sm text-zinc-900">{oficina.nome}</strong>
                        <span className="block text-xs text-zinc-600">{oficina.endereco || 'Sem endereço informado'}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" variant="subtle" disabled={saving}>
                {saving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar mecânico'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Limpar
              </Button>
            </div>
          </form>
        </SurfacePanel>
        </div>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default ManageMechanicsPage