import { AuthenticatedLayout } from '../components/layout'
import { UserProfileSection } from '../components/features'

export function PerfilCliente() {
	return (
		<AuthenticatedLayout>
				<UserProfileSection />
		</AuthenticatedLayout>
	)
}

export default PerfilCliente