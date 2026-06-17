import { useSearchParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { ServiceTrackingSection } from '../components/features'

export function ServiceTrackingPage() {
  const [searchParams] = useSearchParams()
  const veiculoId = searchParams.get('veiculoId') || ''
  const oficinaId = searchParams.get('oficinaId') || ''

  return (
    <AuthenticatedLayout>
        <ServiceTrackingSection initialVeiculoId={veiculoId} initialOficinaId={oficinaId} />
    </AuthenticatedLayout>
  )
}

export default ServiceTrackingPage