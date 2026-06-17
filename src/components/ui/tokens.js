export const FEEDBACK_TONES = {
  neutral: {
    badge: 'Contexto',
    icon: 'info',
    accent: 'bg-zinc-400',
    surface: 'border-zinc-200 bg-zinc-50 text-zinc-800',
    iconWrap: 'bg-white/80 text-zinc-700',
    button: 'text-zinc-600 hover:text-zinc-900',
    dialogPanel: 'bg-zinc-50 text-zinc-950',
    dialogIconWrap: 'bg-zinc-900 text-white',
    dialogPrimary: 'bg-zinc-950 text-white hover:bg-zinc-800',
  },
  info: {
    badge: 'Informação',
    icon: 'info',
    accent: 'bg-sky-500',
    surface: 'border-sky-200 bg-sky-50 text-sky-950',
    iconWrap: 'bg-white/80 text-sky-700',
    button: 'text-sky-700 hover:text-sky-950',
    dialogPanel: 'bg-sky-50 text-sky-950',
    dialogIconWrap: 'bg-sky-500 text-white',
    dialogPrimary: 'bg-sky-600 text-white hover:bg-sky-700',
  },
  success: {
    badge: 'Sucesso',
    icon: 'check_circle',
    accent: 'bg-emerald-500',
    surface: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    iconWrap: 'bg-white/80 text-emerald-700',
    button: 'text-emerald-700 hover:text-emerald-950',
    dialogPanel: 'bg-emerald-50 text-emerald-950',
    dialogIconWrap: 'bg-emerald-500 text-white',
    dialogPrimary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  warning: {
    badge: 'Aviso',
    icon: 'warning',
    accent: 'bg-amber-500',
    surface: 'border-amber-200 bg-amber-50 text-amber-950',
    iconWrap: 'bg-white/80 text-amber-700',
    button: 'text-amber-700 hover:text-amber-950',
    dialogPanel: 'bg-amber-50 text-amber-950',
    dialogIconWrap: 'bg-amber-500 text-white',
    dialogPrimary: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  error: {
    badge: 'Erro',
    icon: 'error',
    accent: 'bg-red-500',
    surface: 'border-red-200 bg-red-50 text-red-950',
    iconWrap: 'bg-white/80 text-red-700',
    button: 'text-red-700 hover:text-red-950',
    dialogPanel: 'bg-red-50 text-red-950',
    dialogIconWrap: 'bg-red-500 text-white',
    dialogPrimary: 'bg-red-600 text-white hover:bg-red-700',
  },
}

export const DIALOG_TONE_ALIAS = {
  default: 'neutral',
  danger: 'error',
}

export const STATUS_BADGE_TONES = {
  pending: 'bg-zinc-100 text-zinc-700',
  active: 'bg-amber-100 text-amber-900',
  done: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-red-100 text-red-900',
  neutral: 'bg-zinc-100 text-zinc-700',
}

export const TIMELINE_STATE_TONES = {
  completed: 'border-emerald-200 bg-emerald-50',
  active: 'border-red-200 bg-red-50',
  pending: 'border-zinc-200 bg-zinc-50 opacity-90',
  neutral: 'border-zinc-200 bg-zinc-50 opacity-70',
  cancelled: 'border-red-200 bg-red-50',
}

export const TIMELINE_MARKER_TONES = {
  completed: 'border-emerald-300 bg-white text-emerald-700',
  active: 'border-red-300 bg-white text-red-700',
  pending: 'border-zinc-200 bg-white text-zinc-500',
  neutral: 'border-zinc-200 bg-white text-zinc-400',
  cancelled: 'border-red-300 bg-white text-red-700',
}