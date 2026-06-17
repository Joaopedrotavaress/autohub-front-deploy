import { useParams } from 'react-router-dom'
import { ServiceTrackingDriverSection } from '../components/features'
import { AuthenticatedLayout } from '../components/layout'

export function ServiceTrackingDriverPage() {
  const { id = '' } = useParams()

  return (
    <AuthenticatedLayout>
      <ServiceTrackingDriverSection ordemId={id} />
    </AuthenticatedLayout>
  )
}

export default ServiceTrackingDriverPage
