import { useParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { ServiceRegistrationSection } from '../components/features'

export function RegisterServicePage() {
  const { oficinaId = '' } = useParams()

  return (
    <AuthenticatedLayout>
        <ServiceRegistrationSection initialOficinaId={oficinaId} />
    </AuthenticatedLayout>
  )
}

export default RegisterServicePage