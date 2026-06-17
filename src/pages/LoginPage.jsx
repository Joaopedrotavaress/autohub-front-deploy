import { AuthSplitLayout } from '../components/layout'
import { LoginForm } from '../components/common/LoginForm'

export function LoginPage() {
  return (
    <AuthSplitLayout
      badge="O ateliê mecânico"
      description="Vivencie o atelier mecânico. Onde seu veículo recebe o tratamento que merece."
      imageAlt="Atelier automotivo moderno"
      imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuBm6yckqFXWgUzraywdSKw2xXV1M43VopjyJea6EB2mRuP15QLnj2Vr1RhU2bpHrDWWrw_4nT68OuS8VPxRbRzO9ZWKRV3rsUjoLubbePcy_Nm0qExYmzugPy2CjFF67-FLEhIEfXA7g_h0H-RtMxgZ3kvhFvhsua8xzsAL3X801C4c_NUiBOBZ0dQN_8BAzRg44-fsaWzMOXFqMQTVwkHZ22pK_NsXZna-jYz5FjOz3d0S-LEIY0-wxZoKmOXo1h1dMt9xPmNeIr6d"
      title="Precisão não é uma opção."
    >
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Bem-vindo de volta</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">Entre no painel do seu atelier mecânico.</p>
      </div>
      <LoginForm />
    </AuthSplitLayout>
  )
}

export default LoginPage
