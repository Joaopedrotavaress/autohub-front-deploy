const ROLE_BY_TIPO = {
  0: 'DONO_OFICINA',
  1: 'MECANICO',
  2: 'MOTORISTA',
  3: 'VISITANTE',
  4: 'ADMINISTRADOR_DA_PLATAFORMA',
}

export const ROLES = {
  VISITANTE: 'VISITANTE',
  MOTORISTA: 'MOTORISTA',
  CLIENTE: 'CLIENTE',
  DONO_OFICINA: 'DONO_OFICINA',
  MECANICO: 'MECANICO',
  ADMIN: 'ADMIN',
  ADMINISTRADOR_DA_PLATAFORMA: 'ADMINISTRADOR_DA_PLATAFORMA',
}

export const ROUTE_ACCESS = {
  '/': [ROLES.VISITANTE, ROLES.MOTORISTA, ROLES.DONO_OFICINA, ROLES.MECANICO, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/home': [ROLES.VISITANTE, ROLES.MOTORISTA, ROLES.DONO_OFICINA, ROLES.MECANICO, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/login': [ROLES.VISITANTE],
  '/forgot-password': [ROLES.VISITANTE],
  '/register': [ROLES.VISITANTE],
  '/register/veiculo': [ROLES.MOTORISTA, ROLES.CLIENTE, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/minha-garagem': [ROLES.MOTORISTA, ROLES.CLIENTE, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/minhas-oficinas': [ROLES.DONO_OFICINA, ROLES.MECANICO, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/register/oficina': [ROLES.DONO_OFICINA, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/equipe': [ROLES.DONO_OFICINA, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/servico/cadastrar': [ROLES.DONO_OFICINA, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/servicos': [ROLES.DONO_OFICINA, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/ordem': [ROLES.MOTORISTA, ROLES.CLIENTE, ROLES.DONO_OFICINA, ROLES.MECANICO, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/ordem/motorista': [ROLES.MOTORISTA, ROLES.CLIENTE, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/ordem/novo': [ROLES.DONO_OFICINA, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/cliente/planos': [ROLES.MOTORISTA, ROLES.CLIENTE],
  '/cliente/meu-plano': [ROLES.MOTORISTA, ROLES.CLIENTE],
  '/admin/dashboard': [ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/admin/planos': [ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/admin/assinaturas': [ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/admin/oficinas': [ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/admin/kafka-dashboard': [ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/admin/kafka': [ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/workshops': [ROLES.VISITANTE, ROLES.MOTORISTA, ROLES.DONO_OFICINA, ROLES.MECANICO, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/workshop': [ROLES.VISITANTE, ROLES.MOTORISTA, ROLES.DONO_OFICINA, ROLES.MECANICO, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
  '/perfilcliente': [ROLES.MOTORISTA, ROLES.CLIENTE, ROLES.DONO_OFICINA, ROLES.MECANICO, ROLES.ADMIN, ROLES.ADMINISTRADOR_DA_PLATAFORMA],
}

export const NAV_ITEMS_BY_ROLE = {
  [ROLES.VISITANTE]: [
    { label: 'Oficinas', to: '/workshops', icon: 'storefront' },
  ],
  [ROLES.MOTORISTA]: [
    { label: 'Oficinas', to: '/workshops', icon: 'storefront' },
    { label: 'Minha Garagem', to: '/minha-garagem', icon: 'garage' },
    { label: 'Planos', to: '/cliente/planos', icon: 'subscriptions' },
    { label: 'Meu Plano', to: '/cliente/meu-plano', icon: 'receipt_long' },
    { label: 'Acompanhamento', to: '/ordem/motorista', icon: 'route' },
  ],
  [ROLES.CLIENTE]: [
    { label: 'Oficinas', to: '/workshops', icon: 'storefront' },
    { label: 'Minha Garagem', to: '/minha-garagem', icon: 'garage' },
    { label: 'Planos', to: '/cliente/planos', icon: 'subscriptions' },
    { label: 'Meu Plano', to: '/cliente/meu-plano', icon: 'receipt_long' },
    { label: 'Acompanhamento', to: '/ordem/motorista', icon: 'route' },
  ],
  [ROLES.DONO_OFICINA]: [
    { label: 'Minhas Oficinas', to: '/minhas-oficinas', icon: 'garage_home' },
    { label: 'Equipe', to: '/equipe', icon: 'group' },
    { label: 'Meus Serviços', to: '/servicos', icon: 'design_services' },
    { label: 'Nova Ordem', to: '/ordem/novo', icon: 'note_add' },
    { label: 'Acompanhamento', to: '/ordem', icon: 'route' },
  ],
  [ROLES.MECANICO]: [
    { label: 'Minhas Oficinas', to: '/minhas-oficinas', icon: 'garage_home' },
    { label: 'Oficinas', to: '/workshops', icon: 'storefront' },
    { label: 'Acompanhamento', to: '/ordem', icon: 'route' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Planos', to: '/admin/planos', icon: 'sell' },
    { label: 'Assinaturas', to: '/admin/assinaturas', icon: 'subscriptions' },
    { label: 'Oficinas', to: '/admin/oficinas', icon: 'storefront' },
    { label: 'Kafka Dash', to: '/admin/kafka-dashboard', icon: 'monitoring' },
    { label: 'Kafka', to: '/admin/kafka', icon: 'dns' },
  ],
  [ROLES.ADMINISTRADOR_DA_PLATAFORMA]: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Planos', to: '/admin/planos', icon: 'sell' },
    { label: 'Assinaturas', to: '/admin/assinaturas', icon: 'subscriptions' },
    { label: 'Oficinas', to: '/admin/oficinas', icon: 'storefront' },
    { label: 'Kafka Dash', to: '/admin/kafka-dashboard', icon: 'monitoring' },
    { label: 'Kafka', to: '/admin/kafka', icon: 'dns' },
  ],
}

export const ROLE_DEFAULT_ROUTE = {
  [ROLES.VISITANTE]: '/',
  [ROLES.MOTORISTA]: '/minha-garagem',
  [ROLES.CLIENTE]: '/cliente/meu-plano',
  [ROLES.DONO_OFICINA]: '/minhas-oficinas',
  [ROLES.MECANICO]: '/minhas-oficinas',
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.ADMINISTRADOR_DA_PLATAFORMA]: '/admin/dashboard',
}

export function normalizeRole(roleOrTipo) {
  if (roleOrTipo == null) {
    return ROLES.VISITANTE
  }

  const rawValue = String(roleOrTipo).trim()
  if (!rawValue) {
    return ROLES.VISITANTE
  }

  const upperValue = rawValue.toUpperCase()
  if (Object.values(ROLES).includes(upperValue)) {
    return upperValue
  }

  const numericValue = Number(rawValue)
  if (!Number.isNaN(numericValue) && ROLE_BY_TIPO[numericValue]) {
    return ROLE_BY_TIPO[numericValue]
  }

  return ROLES.VISITANTE
}

export function getUserRole(user) {
  if (!user) {
    return ROLES.VISITANTE
  }

  return normalizeRole(user.role || user.tipo)
}

export function isAuthenticated(user) {
  return getUserRole(user) !== ROLES.VISITANTE
}

export function hasRoleAccess(user, allowedRoles = []) {
  if (!allowedRoles.length) return true

  const role = getUserRole(user)
  return role === ROLES.ADMIN || role === ROLES.ADMINISTRADOR_DA_PLATAFORMA || allowedRoles.includes(role)
}

export function getDefaultRouteForUser(user) {
  return ROLE_DEFAULT_ROUTE[getUserRole(user)] || '/'
}

export function normalizePath(pathname = '/') {
  if (pathname === '/home') return '/home'

  if (pathname.startsWith('/workshop/')) return '/workshop'
  if (pathname.startsWith('/minhas-oficinas/')) return '/minhas-oficinas'
  if (pathname.startsWith('/register/oficina/')) return '/register/oficina'
  if (pathname.startsWith('/equipe/')) return '/equipe'
  if (pathname.startsWith('/register/veiculo/')) return '/register/veiculo'
  if (pathname.startsWith('/minha-garagem/')) return '/minha-garagem'
  if (pathname.startsWith('/servico/cadastrar/')) return '/servico/cadastrar'
  if (pathname.startsWith('/servicos/')) return '/servicos'
  if (pathname.startsWith('/ordem/novo')) return '/ordem/novo'
  if (pathname.startsWith('/ordem/motorista')) return '/ordem/motorista'
  if (pathname.startsWith('/ordem/acompanhar/')) return '/ordem/motorista'
  if (pathname.startsWith('/ordem/')) return '/ordem'
  if (pathname.startsWith('/cliente/planos')) return '/cliente/planos'
  if (pathname.startsWith('/cliente/meu-plano')) return '/cliente/meu-plano'
  if (pathname.startsWith('/admin/planos')) return '/admin/planos'
  if (pathname.startsWith('/admin/kafka-dashboard')) return '/admin/kafka-dashboard'
  if (pathname.startsWith('/perfilcliente/')) return '/perfilcliente'

  return pathname
}

export function isRouteActive(currentPathname, routePath) {
  return normalizePath(currentPathname) === normalizePath(routePath)
}

export function getAllowedRolesForPath(pathname) {
  return ROUTE_ACCESS[normalizePath(pathname)] || null
}

export function getNavigationItems(user) {
  return NAV_ITEMS_BY_ROLE[getUserRole(user)] || NAV_ITEMS_BY_ROLE[ROLES.VISITANTE]
}
