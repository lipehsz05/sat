import type { PromotionPayload } from './types';

/** Campanhas mock — em produção viriam da API */
export const MOCK_PROMOTIONS: PromotionPayload[] = [
  {
    id: 'promo-upgrade',
    title: 'Upgrade de velocidade',
    body: 'Cliente fiel: 200 Mega por R$ 99,90/mês no primeiro endereço. Válido até 30/06.',
    route: '/(tabs)',
  },
  {
    id: 'promo-indicacao',
    title: 'Indique e ganhe desconto',
    body: 'Indique um amigo e ganhe 10% de desconto na próxima fatura.',
    route: '/(tabs)',
  },
];
