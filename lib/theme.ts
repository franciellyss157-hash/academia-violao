export const C = {
  bg: '#07030A',
  bgWine: '#16050E',
  wine: '#2A0A18',
  surface: 'rgba(255,255,255,0.05)',
  surfaceStrong: 'rgba(255,255,255,0.09)',
  border: 'rgba(233,199,124,0.18)',
  borderPink: 'rgba(255,61,154,0.32)',
  pink: '#FF3D9A',
  pinkDeep: '#C21C6C',
  pinkSoft: '#FF8AC2',
  gold: '#E9C77C',
  goldDeep: '#A8843F',
  text: '#F9EFF4',
  muted: '#B58FA0',
  danger: '#FF5A6E',
  ok: '#5BE0A8',
  warn: '#FFC857',
};

export const F = {
  display: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_600SemiBold_Italic',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semi: 'Inter_700Bold',
};

export const INTENTS: Record<string, string> = {
  amizade: 'Amizade',
  namoro: 'Namoro',
  relacionamento_serio: 'Relacionamento sério',
  algo_casual: 'Algo casual',
};

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  awaiting_receipt: { label: 'Aguardando comprovante', color: C.warn },
  under_review: { label: 'Em análise', color: C.pink },
  approved: { label: 'Aprovado', color: C.ok },
  rejected: { label: 'Recusado', color: C.danger },
};
