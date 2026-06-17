import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { Button, Card, Field, Input, PageStack, SectionHeader } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { createVeiculo } from '../services/veiculoService'
import { useAppContext } from '../context/AppContext'

export function RegisterVehiclePage() {
  const { user } = useAppContext()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({ nome: '', marca: '', modelo: '', ano: '', placa: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const validateForm = () => {
    if (!user?.id) {
      toast.error('É necessário estar autenticado para cadastrar veículos.')
      return false
    }
    if (!form.nome.trim()) { toast.warning('Informe um nome para o veículo.'); return false }
    if (!form.marca.trim()) { toast.warning('Informe a marca do veículo.'); return false }
    if (!form.modelo.trim()) { toast.warning('Informe o modelo do veículo.'); return false }
    if (!form.placa.trim()) { toast.warning('Informe a placa do veículo.'); return false }
    if (!form.ano || !String(form.ano).trim()) { toast.warning('Informe o ano do veículo.'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    try {
      const veiculo = await createVeiculo(form)
      toast.success(`Veículo cadastrado com sucesso: ${veiculo.nome}.`)
      setForm({ nome: '', marca: '', modelo: '', ano: '', placa: '' })
      navigate('/minha-garagem')
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar veículo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <PageStack maxWidth="max-w-5xl">
        <SectionHeader
          description="Registre veículos dos clientes para gerenciar manutenções e histórico com o mesmo padrão visual do restante do sistema."
          eyebrow="Minha garagem"
          title="Cadastro de Veículo"
        />

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field htmlFor="nome" label="Nome">
                <Input id="nome" name="nome" value={form.nome} onChange={handleChange} required placeholder="Civic do João" />
              </Field>

              <Field htmlFor="marca" label="Marca">
                <Input id="marca" name="marca" value={form.marca} onChange={handleChange} required placeholder="Honda" />
              </Field>

              <Field htmlFor="modelo" label="Modelo">
                <Input id="modelo" name="modelo" value={form.modelo} onChange={handleChange} required placeholder="Civic LX" />
              </Field>

              <Field htmlFor="ano" label="Ano">
                <Input id="ano" name="ano" value={form.ano} onChange={handleChange} required type="number" min="1900" max="2100" placeholder="2020" />
              </Field>

              <Field className="md:col-span-2" htmlFor="placa" label="Placa">
                <Input id="placa" name="placa" value={form.placa} onChange={handleChange} required placeholder="ABC1D23" />
              </Field>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={loading} fullWidth size="lg">
                {loading ? 'Cadastrando...' : 'Cadastrar veículo'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
            </div>
          </form>
        </Card>
      </PageStack>
    </AuthenticatedLayout>
  )
}

export default RegisterVehiclePage
