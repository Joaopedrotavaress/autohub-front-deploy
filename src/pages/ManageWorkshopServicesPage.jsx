import { AuthenticatedLayout } from '../components/layout'
import { ServiceManagementSection } from '../components/features'

export function ManageWorkshopServicesPage() {
  return (
    <AuthenticatedLayout>
        <ServiceManagementSection />
    </AuthenticatedLayout>
  )
}

export default ManageWorkshopServicesPage