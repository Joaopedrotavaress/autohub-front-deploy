import { useParams, useSearchParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { ServiceTrackingDetailSection } from '../components/features'

export function ServiceTrackingDetailPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const oficinaId = searchParams.get('oficinaId') || ''
  const veiculoId = searchParams.get('veiculoId') || ''

  return (
    <AuthenticatedLayout>
      <ServiceTrackingDetailSection ordemId={id} initialOficinaId={oficinaId} initialVeiculoId={veiculoId} />
    </AuthenticatedLayout>
  )
}

export default ServiceTrackingDetailPage