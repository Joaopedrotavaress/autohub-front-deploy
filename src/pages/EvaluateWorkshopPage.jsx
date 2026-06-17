import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { AuthenticatedLayout } from '../components/layout'
import { getOficinaDetalhe } from '../services/oficinaViewService'
import { createAvaliacao } from '../services/avaliacaoService'
import { getUsuario } from '../services/authService'
import { getOrdensByOficinaId } from '../services/ordemService'

export function EvaluateWorkshopPage() {
  const { id: oficinaId } = useParams()
  const navigate = useNavigate()
  const [oficina, setOficina] = useState(null)
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [ordens, setOrdens] = useState([])
  const [ordemId, setOrdemId] = useState('')
  const [loading, setLoading] = useState(false)

  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getOficinaDetalhe(oficinaId)
        if (!cancelled) setOficina(data)
      } catch (err) {
        toast.error(err?.message || 'Erro ao carregar oficina')
      }

      try {
        const usuario = getUsuario()
        if (usuario?.id) {
          const all = await getOrdensByOficinaId(oficinaId)
          // filter orders by current user
          const mine = Array.isArray(all) ? all.filter((o) => String(o.usuarioId || o.usuario?.id) === String(usuario.id)) : []
          if (!cancelled) setOrdens(mine)
        }
      } catch (err) {
        // ignore optional orders error
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [oficinaId])

  const onSubmit = async (e) => {
    e.preventDefault()
    const usuario = getUsuario()
    if (!usuario?.id) {
      toast.error('É necessário estar autenticado para avaliar a oficina.')
      return
    }

    if (!oficinaId) {
      toast.warning('Oficina inválida.')
      return
    }

    if (!nota || nota < 1 || nota > 5) {
      toast.warning('Selecione uma nota entre 1 e 5.')
      return
    }

    const payload = {
      usuarioId: usuario.id,
      oficinaId,
      nota,
      comentario: comentario || undefined,
      observacoes: observacoes || undefined,
      ordemServicoId: ordemId || undefined,
    }

    try {
      setLoading(true)
      await createAvaliacao(payload)
      toast.success('Avaliação enviada com sucesso.')
      navigate(`/workshop/${oficinaId}`)
    } catch (err) {
      const message = err?.data?.mensagem || err?.message || 'Erro ao enviar avaliação.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-black">Avaliar oficina</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold">{oficina?.nome || 'Carregando...'}</h2>
          <form onSubmit={onSubmit} className="mt-4 grid gap-4">
            <div>
              <label className="block text-sm font-bold">Nota</label>
              <div className="mt-2 flex items-center gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setNota(n)}
                    className={`rounded-full px-3 py-2 text-sm font-black ${nota>=n ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold">Comentário (opcional)</label>
              <textarea maxLength={1000} value={comentario} onChange={(e) => setComentario(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 p-3" rows={4} />
            </div>

            {ordens.length > 0 && (
              <div>
                <label className="block text-sm font-bold">Ordem de serviço (vincular)</label>
                <select value={ordemId} onChange={(e) => setOrdemId(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 p-3">
                  <option value="">Nenhuma</option>
                  {ordens.map((o) => (
                    <option key={o.id} value={o.id}>{`Ordem ${o.id} — ${o.status || ''}`}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button disabled={loading} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white">
                {loading ? 'Enviando...' : 'Enviar avaliação'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

export default EvaluateWorkshopPage
