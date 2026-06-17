import { useParams } from 'react-router-dom'
import { AuthenticatedLayout } from '../components/layout'
import { WorkshopSection } from '../components/features'

export function WorkshopPage() {
  const { id } = useParams()
  const workshopId = id || ''

  return (
    <AuthenticatedLayout fullBleed>
        <WorkshopSection initialWorkshopId={workshopId} />
    </AuthenticatedLayout>
  )
}

export default WorkshopPage