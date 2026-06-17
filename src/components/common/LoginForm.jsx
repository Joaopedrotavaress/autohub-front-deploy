import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/authService'
import { useAppContext } from '../../context/AppContext'
import { getDefaultRouteForUser } from '../../utils/accessControl'

export function LoginForm() {
  const navigate = useNavigate()
  const [credenciais, setCredenciais] = useState({
    email: '',
    senha: '',
  })
  const [mostraSenha, setMostraSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const appContext = useAppContext()

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setCredenciais(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!credenciais.email.trim()) {
      setMessage({ type: 'error', text: 'Email é obrigatório' })
      return false
    }
    if (!credenciais.email.includes('@')) {
      setMessage({ type: 'error', text: 'Email inválido' })
      return false
    }
    if (!credenciais.senha.trim()) {
      setMessage({ type: 'error', text: 'Senha é obrigatória' })
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
      const { token, usuario } = await login(credenciais)
      // atualizar contexto
      if (usuario && usuario.id) {
        // use context to set user/token
        appContext.login(usuario, token)
        setMessage({ type: 'success', text: 'Login realizado com sucesso!' })
        setTimeout(() => {
          navigate(getDefaultRouteForUser(usuario))
        }, 400)
      } else {
        setMessage({ type: 'error', text: 'Usuário não encontrado no token ou na resposta do servidor.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer login' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensagem de Feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-green-100 text-green-900 border border-green-300'
              : 'bg-red-100 text-red-900 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="font-label text-xs font-semibold uppercase tracking-wider text-secondary px-1"
        >
          E-mail
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">mail</span>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Digite seu e-mail"
            value={credenciais.email}
            onChange={handleFieldChange}
            disabled={loading}
            required
            className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Senha */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label
            htmlFor="senha"
            className="font-label text-xs font-semibold uppercase tracking-wider text-secondary"
          >
            Senha
          </label>
          <a
            href="/forgot-password"
            className="text-xs font-semibold text-primary hover:underline decoration-2 underline-offset-4 transition-all"
          >
            Esqueceu a senha?
          </a>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </div>
          <input
            id="senha"
            name="senha"
            type={mostraSenha ? 'text' : 'password'}
            placeholder="••••••••"
            value={credenciais.senha}
            onChange={handleFieldChange}
            disabled={loading}
            required
            className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-12 text-on-surface placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setMostraSenha(!mostraSenha)}
            disabled={loading}
            className="absolute inset-y-0 right-4 flex items-center text-secondary hover:text-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mostraSenha ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      {/* Botão Entrar */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-br from-primary to-[#e31b23] text-white font-headline font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Entrando...' : 'Entrar'}
          {!loading && (
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          )}
        </button>
      </div>

      {/* Link Cadastro */}
      <div className="mt-10 pt-10 border-t border-surface-variant flex flex-col items-center">
        <p className="text-secondary text-sm">
          Não tem uma conta?{' '}
          <a
            href="/register"
            className="text-on-surface font-bold hover:text-primary transition-colors"
          >
            Cadastre-se
          </a>
        </p>
      </div>
    </form>
  )
}

export default LoginForm
