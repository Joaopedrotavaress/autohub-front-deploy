import { useState } from 'react'
import { AuthSplitLayout } from '../components/layout'
import RegisterForm from '../components/common/RegisterForm'

export function RegisterPage() {
  const [userType, setUserType] = useState('MOTORISTA')

  return (
    <AuthSplitLayout
      badge="O ateliê mecânico"
      description="Junte-se à rede que conecta veículos de alta performance com a perícia mecânica mais precisa do mercado."
      imageAlt="Ferramentas de precisão em uma oficina moderna"
      imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuD80XVskOnlPAEf7e38FgrmcB18C3aQpmm0usVY1z94fWftBcJ9JHju2YA0V0IrZ8C15r-feLiuVm3CneSqXNzUTCEVwicCK-wiUz1RJhiSCDTBo7BbjzqBN7dtzrk-vAJ1ccrzRl6Xiapse_DELc-r_SjQk6kzEYvxc0sYhpCVOQil-7HFniG-VxmW7khrIXKKLdJsTr6DuzzuOp4jqMJGPf3sJYvy_i59gnwsPlasTpTtxMQUHuQdizxfrRmgtaS4YX4J5fFinXEH"
      title="Precisão. Performance. Parceria."
    >
      <RegisterForm userType={userType} setUserType={setUserType} />
    </AuthSplitLayout>
  )
}

export default RegisterPage
