import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../../services/authService'

export function ForgotPasswordForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // 'email' ou 'reset'
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostraSenha, setMostraSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const validateEmail = () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Email é obrigatório' })
      return false
    }
    if (!email.includes('@')) {
      setMessage({ type: 'error', text: 'Email inválido' })
      return false
    }
    return true
  }

  const validateReset = () => {
    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Token é obrigatório' })
      return false
    }
    if (!novaSenha.trim()) {
      setMessage({ type: 'error', text: 'Senha é obrigatória' })
      return false
    }
    if (novaSenha.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' })
      return false
    }
    if (novaSenha !== confirmarSenha) {
      setMessage({ type: 'error', text: 'As senhas não conferem' })
      return false
    }
    return true
  }

  const handleSubmitEmail = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (!validateEmail()) {
      return
    }

    setLoading(true)

    try {
      await forgotPassword(email)
      setMessage({
        type: 'success',
        text: 'Link de recuperação enviado! Verifique seu email para prosseguir.',
      })
      setTimeout(() => {
        setStep('reset')
        setMessage(null)
      }, 2000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao enviar link. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReset = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (!validateReset()) {
      return
    }

    setLoading(true)

    try {
      await resetPassword({
        email,
        token,
        novaSenha,
      })
      setMessage({
        type: 'success',
        text: 'Senha redefinida com sucesso! Redirecionando...',
      })
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao redefinir senha. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleSubmitEmail} className="space-y-6">
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

        {/* Email Input */}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-secondary px-1">
            Enviaremos um link de recuperação para este email
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full primary-gradient-cta text-on-primary font-headline font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transform transition-all active:scale-[0.98] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
          <p className="text-center text-on-surface-variant text-sm font-medium">
            Lembrou sua senha?
            <a
              className="text-primary hover:underline decoration-2 underline-offset-4 font-bold ml-1 transition-all"
              href="/login"
            >
              Entrar
            </a>
          </p>
        </div>

        {/* Security Info */}
        <div className="pt-6 border-t border-surface-container">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
            <span className="material-symbols-outlined text-secondary text-sm flex-shrink-0 mt-0.5">
              shield_lock
            </span>
            <div className="text-xs text-secondary">
              <strong>Sua segurança é nossa prioridade.</strong> O link de recuperação expira em 24 horas.
            </div>
          </div>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmitReset} className="space-y-6">
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

      {/* Token Input */}
      <div className="space-y-2">
        <label
          htmlFor="token"
          className="font-label text-xs font-semibold uppercase tracking-wider text-secondary px-1"
        >
          Código de Verificação
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <input
            id="token"
            name="token"
            type="text"
            placeholder="Cole o código recebido no email"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
            required
            className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-widest"
          />
        </div>
      </div>

      {/* Nova Senha */}
      <div className="space-y-2">
        <label
          htmlFor="novaSenha"
          className="font-label text-xs font-semibold uppercase tracking-wider text-secondary px-1"
        >
          Nova Senha
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </div>
          <input
            id="novaSenha"
            name="novaSenha"
            type={mostraSenha ? 'text' : 'password'}
            placeholder="••••••••"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
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
        <p className="text-xs text-secondary px-1">
          Mínimo 6 caracteres
        </p>
      </div>

      {/* Confirmar Senha */}
      <div className="space-y-2">
        <label
          htmlFor="confirmarSenha"
          className="font-label text-xs font-semibold uppercase tracking-wider text-secondary px-1"
        >
          Confirmar Senha
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <input
            id="confirmarSenha"
            name="confirmarSenha"
            type={mostraSenha ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            disabled={loading}
            required
            className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full primary-gradient-cta text-on-primary font-headline font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transform transition-all active:scale-[0.98] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Redefinindo...' : 'Redefinir Senha'}
        </button>
        <p className="text-center text-on-surface-variant text-sm font-medium">
          Não recebeu o código?
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setToken('')
              setNovaSenha('')
              setConfirmarSenha('')
              setMessage(null)
            }}
            className="text-primary hover:underline decoration-2 underline-offset-4 font-bold ml-1 transition-all cursor-pointer bg-none border-none"
          >
            Voltar
          </button>
        </p>
      </div>

      {/* Security Info */}
      <div className="pt-6 border-t border-surface-container">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
          <span className="material-symbols-outlined text-secondary text-sm flex-shrink-0 mt-0.5">
            lock_open
          </span>
          <div className="text-xs text-secondary">
            <strong>Dica de segurança:</strong> Use uma senha forte e única que você não compartilha com outros serviços.
          </div>
        </div>
      </div>
    </form>
  )
}

export default ForgotPasswordForm
