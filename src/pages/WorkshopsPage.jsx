import { AuthenticatedLayout } from '../components/layout'
import { WorkshopsCatalogSection } from '../components/features'

export function WorkshopsPage() {
  return (
    <AuthenticatedLayout fullBleed>
        <WorkshopsCatalogSection />
    </AuthenticatedLayout>
  )
}

export default WorkshopsPage