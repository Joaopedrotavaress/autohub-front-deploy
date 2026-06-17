import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUsuario } from '../../services/usuarioService'
import { login as authLogin } from '../../services/authService'
import { useAppContext } from '../../context/AppContext'
import { getDefaultRouteForUser } from '../../utils/accessControl'

const USER_TYPES = {
  DONO_OFICINA: 0,
  MOTORISTA: 2,
}

const JOURNEYS = [
  {
    value: 'MOTORISTA',
    label: 'Motorista',
    submitLabel: 'Criar conta de motorista',
    successLabel: 'Cadastro realizado! Bem-vindo',
  },
  {
    value: 'DONO_OFICINA',
    label: 'Dono de Oficina',
    submitLabel: 'Criar conta profissional',
    successLabel: 'Cadastro profissional realizado! Bem-vindo',
  },
]

function getNextRoute(role, user) {
  if (role === 'DONO_OFICINA') {
    return '/login'
  }

  if (role === 'MOTORISTA') {
    return '/register/veiculo'
  }

  return getDefaultRouteForUser(user)
}

export function RegisterForm({ userType, setUserType }) {
  const navigate = useNavigate()
  const appContext = useAppContext()
  const selectedJourney = JOURNEYS.find((journey) => journey.value === userType) || JOURNEYS[0]
  const [personal, setPersonal] = useState({
    nome: '',
    email: '',
    senha: '',
    senhaConfirm: '',
  })


  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setPersonal(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!personal.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome e obrigatorio' })
      return false
    }

    if (!personal.email.trim()) {
      setMessage({ type: 'error', text: 'Email e obrigatorio' })
      return false
    }

    if (personal.senha !== personal.senhaConfirm) {
      setMessage({ type: 'error', text: 'As senhas nao conferem' })
      return false
    }

    if (!personal.senha.trim()) {
      setMessage({ type: 'error', text: 'Senha e obrigatoria' })
      return false
    }
    if (personal.senha.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no minimo 6 caracteres' })
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const tipoUsuario = USER_TYPES[userType] ?? USER_TYPES.MOTORISTA
      
      const usuario = await createUsuario({
        nome: personal.nome.trim(),
        email: personal.email.trim(),
        senha: personal.senha,
        tipo: tipoUsuario,
      })

      // Para Motorista, fazer login automático
      if (userType === 'MOTORISTA') {
        const authResult = await authLogin({
          email: personal.email.trim(),
          senha: personal.senha,
        })

        if (authResult?.usuario && authResult?.token) {
          appContext.login(authResult.usuario, authResult.token)
        }

        setMessage({
          type: 'success',
          text: `${selectedJourney.successLabel}, ${usuario.nome}!`,
        })

        setTimeout(() => {
          navigate(getNextRoute(userType, authResult?.usuario || usuario))
        }, 1200)
      } else {
        // Para Dono de Oficina, não fazer login e redirecionar para login
        setMessage({
          type: 'success',
          text: `${selectedJourney.successLabel}, ${usuario.nome}! Faça login para continuar.`,
        })

        setTimeout(() => {
          navigate('/login')
        }, 1200)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao criar cadastro. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-1">Crie sua conta</h2>
        <p className="text-on-surface-variant font-medium text-sm">Cadastro público disponível apenas para motorista e dono de oficina.</p>
      </div>

      {/* Identity Selector */}
      <div className="grid grid-cols-1 gap-2 rounded-xl bg-surface-container-low p-1 sm:grid-cols-2">
        {JOURNEYS.map((journey) => (
          <label className="cursor-pointer group" key={journey.value}>
            <input
              checked={userType === journey.value}
              className="peer hidden"
              name="userType"
              type="radio"
              value={journey.value}
              onChange={(e) => setUserType(e.target.value)}
            />
            <div className="rounded-lg py-3 text-center text-sm font-bold tracking-tight transition-all duration-300 peer-checked:bg-surface-container-lowest peer-checked:text-primary peer-checked:shadow-sm group-hover:bg-white/50">
              <span>{journey.label}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl border-l-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-900'
              : 'bg-red-50 border-red-500 text-red-900'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Fields Grid */}
      <div className="space-y-3">
        {/* Nome Completo */}
        <div className="space-y-1">
          <label className="uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]" htmlFor="nome">
            Nome Completo
          </label>
          <div className="relative group">
            <input
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/40"
              id="nome"
              name="nome"
              placeholder="Kaio Mayer"
              type="text"
              value={personal.nome}
              onChange={handleFieldChange}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]" htmlFor="email">
            Endereço de E-mail
          </label>
          <div className="relative group">
            <input
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/40"
              id="email"
              name="email"
              placeholder="nome@atelier.com"
              type="email"
              value={personal.email}
              onChange={handleFieldChange}
              required
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <label className="uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]" htmlFor="senha">
            Senha
          </label>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/40"
            id="senha"
            name="senha"
            placeholder="••••••••"
            type="password"
            value={personal.senha}
            onChange={handleFieldChange}
            required
          />
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-1">
          <label className="uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]" htmlFor="senhaConfirm">
            Confirmar Senha
          </label>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/40"
            id="senhaConfirm"
            name="senhaConfirm"
            placeholder="••••••••"
            type="password"
            value={personal.senhaConfirm}
            onChange={handleFieldChange}
            required
          />
        </div>
      </div>

      {/* Submit Section */}
      <div className="pt-8 pb-6 space-y-3">
        <button
          className="w-full primary-gradient-cta text-on-primary font-headline font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transform transition-all active:scale-[0.98] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Criando Conta...' : selectedJourney.submitLabel}
        </button>
        <p className="text-center text-on-surface-variant text-sm font-medium">
          Já tem uma conta?
          <a className="text-primary hover:underline decoration-2 underline-offset-4 font-bold ml-1 transition-all" href="/login">
            Entrar
          </a>
        </p>
      </div>
    </form>
  )
}

export default RegisterForm
