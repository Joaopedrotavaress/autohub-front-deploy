import { AuthSplitLayout } from '../components/layout'
import { ForgotPasswordForm } from '../components/common/ForgotPasswordForm'

export function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      badge="O ateliê mecânico"
      description="Recupere o acesso à sua conta com o mesmo padrão visual e clareza do restante da experiência."
      imageAlt="Atelier automotivo moderno"
      imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuBm6yckqFXWgUzraywdSKw2xXV1M43VopjyJea6EB2mRuP15QLnj2Vr1RhU2bpHrDWWrw_4nT68OuS8VPxRbRzO9ZWKRV3rsUjoLubbePcy_Nm0qExYmzugPy2CjFF67-FLEhIEfXA7g_h0H-RtMxgZ3kvhFvhsua8xzsAL3X801C4c_NUiBOBZ0dQN_8BAzRg44-fsaWzMOXFqMQTVwkHZ22pK_NsXZna-jYz5FjOz3d0S-LEIY0-wxZoKmOXo1h1dMt9xPmNeIr6d"
      title="Recupere sua conta com precisão."
    >
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Recupere sua senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">Vamos ajudá-lo a redefinir sua senha e recuperar o acesso.</p>
      </div>
      <ForgotPasswordForm />
    </AuthSplitLayout>
  )
}

export default ForgotPasswordPage
