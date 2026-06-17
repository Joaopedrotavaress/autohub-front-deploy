import { AuthenticatedLayout } from '../components/layout'
import { ServiceTrackingDriverHubSection } from '../components/features'

export function ServiceTrackingDriverHubPage() {
  return (
    <AuthenticatedLayout>
      <ServiceTrackingDriverHubSection />
    </AuthenticatedLayout>
  )
}

export default ServiceTrackingDriverHubPage
