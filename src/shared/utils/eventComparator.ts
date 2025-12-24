/**
 * COMPARADOR DE EVENTOS DE RASTREAMENTO - SHARED UTILS
 *
 * Utilitário para detectar novos eventos em rastreamentos dos Correios.
 * Compara arrays de eventos de forma inteligente, verificando se houve
 * adição de novos eventos ao histórico de rastreamento.
 *
 * Responsabilidades:
 * - Comparar dois arrays de eventos (antigo vs novo)
 * - Detectar se há eventos novos no histórico
 * - Normalizar dados para comparação precisa
 * - Evitar falsos positivos em comparações
 *
 * Estratégia de comparação:
 * 1. Compara quantidade de eventos
 * 2. Cria assinatura única para cada evento
 * 3. Usa Set para verificação eficiente de existência
 * 4. Normaliza dados antes de comparar (trim, ISO date)
 *
 * Uso no sistema:
 * - Job de rastreamento automático
 * - Detectar quando atualizar banco de dados
 * - Evitar atualizações desnecessárias
 *
 * Padrões aplicados:
 * - Comparator Pattern
 * - Hash/Signature Pattern
 * - Data Normalization
 */

import { TrackingEvent } from '../../domain/types/TrackingTypes';

/**
 * Verifica se há novos eventos comparando dois arrays
 *
 * Compara eventos por conteúdo (descrição, data, local) ao invés de
 * referências de objetos ou serialização JSON. Isso garante comparação
 * precisa mesmo quando os objetos são diferentes instâncias.
 *
 * Algoritmo:
 * 1. Se tamanhos diferentes -> há novos eventos
 * 2. Se ambos vazios -> sem mudanças
 * 3. Cria Set de assinaturas dos eventos antigos (O(n))
 * 4. Verifica se algum evento novo não está no Set (O(m))
 * Complexidade: O(n + m) onde n = eventos antigos, m = eventos novos
 *
 * @param oldEvents - Array de eventos existentes no banco
 * @param newEvents - Array de eventos retornados pela API dos Correios
 * @returns true se há eventos novos, false caso contrário
 */
export function hasNewEvents(oldEvents: TrackingEvent[], newEvents: TrackingEvent[]): boolean {
  // Verificação rápida: se o número de eventos mudou, há novos eventos
  if (oldEvents.length !== newEvents.length) {
    return true;
  }

  // Se ambos estão vazios, não há mudanças
  if (oldEvents.length === 0 && newEvents.length === 0) {
    return false;
  }

  // Criar um Set com as assinaturas únicas dos eventos antigos
  // Set oferece busca O(1), muito mais eficiente que array
  const oldEventsSet = new Set(
    oldEvents.map(event => createEventSignature(event))
  );

  // Verificar se existe algum evento novo que não está no Set
  for (const newEvent of newEvents) {
    const signature = createEventSignature(newEvent);
    if (!oldEventsSet.has(signature)) {
      return true; // Encontrou evento novo
    }
  }

  return false; // Todos os eventos novos já existem nos antigos
}

/**
 * Cria uma assinatura única (hash) para um evento
 *
 * Combina os campos principais do evento em uma string única que
 * representa o evento de forma determinística. Normaliza os dados
 * para garantir que comparações sejam consistentes.
 *
 * Normalizações aplicadas:
 * - Datas convertidas para ISO string (padrão UTC)
 * - Strings com trim() para remover espaços extras
 * - Campos opcionais tratados com fallback para string vazia
 *
 * Campos usados na assinatura:
 * - description: Descrição do evento
 * - date: Data/hora do evento
 * - location: Local onde ocorreu
 * - detail: Detalhes adicionais
 * - unitType: Tipo de unidade dos Correios
 * - originUnit: Unidade de origem
 * - destinationUnit: Unidade de destino
 *
 * @param event - Evento de rastreamento
 * @returns String única representando o evento
 */
function createEventSignature(event: TrackingEvent): string {
  // Normalizar data para ISO string (formato padrão)
  const normalizedDate = new Date(event.date).toISOString();

  // Normalizar strings: remover espaços extras e tratar campos opcionais
  const normalizedLocation = (event.location || '').trim();
  const normalizedDescription = event.description.trim();
  const normalizedDetail = (event.detail || '').trim();
  const normalizedUnitType = (event.unitType || '').trim();
  const normalizedOriginUnit = (event.originUnit || '').trim();
  const normalizedDestinationUnit = (event.destinationUnit || '').trim();

  // Combinar todos os campos em uma string única separada por pipe (|)
  // Pipe é usado por ser um caractere raro em textos normais
  return `${normalizedDescription}|${normalizedDate}|${normalizedLocation}|${normalizedDetail}|${normalizedUnitType}|${normalizedOriginUnit}|${normalizedDestinationUnit}`;
}
