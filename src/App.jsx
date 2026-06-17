import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { RegisterPage } from './pages/RegisterPage'
import {
  ManageMechanicsPage,
  ManagePlanosPage,
  ManageWorkshopServicesPage,
  MeuPlanoPage,
  MinhaGaragemPage,
  ProfessionalWorkshopsPage,
  PlanosClientePage,
  RegisterServicePage,
  RegisterOrderPage,
  RegisterWorkshopPage,
  RegisterVehiclePage,
  ServiceTrackingDetailPage,
  ServiceTrackingDriverPage,
  ServiceTrackingDriverHubPage,
  AdminDashboardPage,
  AdminAssinaturasPage,
  AdminOficinasPage,
  AdminKafkaPage,
  AdminKafkaDashboardPage,
} from './pages'
import { EvaluateWorkshopPage } from './pages/EvaluateWorkshopPage'
import { PerfilCliente } from './pages/PerfilCliente'
import { WorkshopPage } from './pages/WorkshopPage'
import { WorkshopsPage } from './pages/WorkshopsPage'
import { ServiceTrackingPage } from './pages/ServiceTrackingPage'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { HomeRedirect } from './components/common/HomeRedirect'
import { ROLES } from './utils/accessControl'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomeRedirect />} />
        <Route path="/login" element={<ProtectedRoute guestOnly><LoginPage /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ProtectedRoute guestOnly><ForgotPasswordPage /></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute guestOnly><RegisterPage /></ProtectedRoute>} />
        <Route path="/minhas-oficinas" element={<ProtectedRoute><ProfessionalWorkshopsPage /></ProtectedRoute>} />
        <Route path="/register/oficina" element={<ProtectedRoute><RegisterWorkshopPage /></ProtectedRoute>} />
        <Route path="/register/oficina/:uid" element={<ProtectedRoute><RegisterWorkshopPage /></ProtectedRoute>} />
        <Route path="/equipe" element={<ProtectedRoute><ManageMechanicsPage /></ProtectedRoute>} />
        <Route path="/register/veiculo" element={<ProtectedRoute><RegisterVehiclePage /></ProtectedRoute>} />
        <Route path="/minha-garagem" element={<ProtectedRoute><MinhaGaragemPage /></ProtectedRoute>} />
        <Route path="/perfilcliente" element={<ProtectedRoute><PerfilCliente /></ProtectedRoute>} />
        <Route path="/cliente/planos" element={<ProtectedRoute allowedRoles={[ROLES.MOTORISTA, ROLES.CLIENTE]}><PlanosClientePage /></ProtectedRoute>} />
        <Route path="/cliente/meu-plano" element={<ProtectedRoute allowedRoles={[ROLES.MOTORISTA, ROLES.CLIENTE]}><MeuPlanoPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA]}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA]}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/planos" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA]}><ManagePlanosPage /></ProtectedRoute>} />
        <Route path="/admin/assinaturas" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA]}><AdminAssinaturasPage /></ProtectedRoute>} />
        <Route path="/admin/oficinas" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA]}><AdminOficinasPage /></ProtectedRoute>} />
        <Route path="/admin/kafka" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA]}><AdminKafkaPage /></ProtectedRoute>} />
        <Route path="/admin/kafka-dashboard" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA]}><AdminKafkaDashboardPage /></ProtectedRoute>} />
        <Route path="/workshops" element={<ProtectedRoute><WorkshopsPage /></ProtectedRoute>} />
        <Route path="/workshop" element={<ProtectedRoute><WorkshopPage /></ProtectedRoute>} />
        <Route path="/workshop/:id" element={<ProtectedRoute><WorkshopPage /></ProtectedRoute>} />
        <Route path="/servico/cadastrar" element={<ProtectedRoute><RegisterServicePage /></ProtectedRoute>} />
        <Route path="/servico/cadastrar/:oficinaId" element={<ProtectedRoute><RegisterServicePage /></ProtectedRoute>} />
        <Route path="/ordem/novo" element={<ProtectedRoute><RegisterOrderPage /></ProtectedRoute>} />
        <Route path="/servicos" element={<ProtectedRoute><ManageWorkshopServicesPage /></ProtectedRoute>} />
        <Route path="/ordem/motorista" element={<ProtectedRoute><ServiceTrackingDriverHubPage /></ProtectedRoute>} />
        <Route path="/ordem" element={<ProtectedRoute><ServiceTrackingPage /></ProtectedRoute>} />
        <Route path="/ordem/:id" element={<ProtectedRoute><ServiceTrackingDetailPage /></ProtectedRoute>} />
        <Route path="/ordem/acompanhar/:id" element={<ProtectedRoute><ServiceTrackingDriverPage /></ProtectedRoute>} />
        <Route path="/workshop/:id/avaliar" element={<ProtectedRoute><EvaluateWorkshopPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
