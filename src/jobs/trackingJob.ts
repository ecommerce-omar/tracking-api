/**
 * JOB DE RASTREAMENTO AUTOMÁTICO
 *
 * Job agendado (cron) que atualiza automaticamente o status de todos os
 * rastreamentos pendentes consultando a API dos Correios. Implementa
 * estratégias de otimização baseadas em análise de dados reais.
 *
 * Responsabilidades:
 * - Executar verificações periódicas de rastreamentos pendentes
 * - Consultar API dos Correios para cada rastreamento
 * - Detectar mudanças de status e novos eventos
 * - Atualizar banco de dados quando houver mudanças
 * - Disparar notificações por email via eventos
 * - Implementar backoff em caso de falhas
 * - Registrar métricas de execução
 *
 * Otimizações baseadas em análise de dados reais:
 * - Horários de maior atividade: 17h (25%), 15h-16h (13.6% cada), 9h (10.2%)
 * - Sem atividade nos domingos (0%)
 * - Maior atividade: Segunda a Sexta-feira (quinta e sexta)
 * - Intervalo principal: 15 minutos (balanceio entre custo e atualidade)
 * - Intervalo de pico: Execuções extras nos horários de maior atividade
 *
 * Estratégia de execução:
 * - Job principal: Segunda a Sábado, 5h-22h, a cada 15min (0,15,30,45)
 * - Job de pico: Segunda a Sábado, 15h-17h, nos minutos 7,22,37,52
 * - Domingos: Inativos (análise mostrou 0% de atividade)
 *
 * Tratamento de erros:
 * - Backoff exponencial após falhas consecutivas
 * - Não quebra fluxo em caso de erro individual
 * - Logging detalhado de sucessos e falhas
 *
 * Padrões aplicados:
 * - Cron Job Pattern
 * - Fail-Safe Pattern
 * - Exponential Backoff
 * - Batch Processing
 */

import cron from "node-cron";
import { DIContainer } from "../infrastructure/container/DIContainer";
import { GetAllTrackingsUseCase } from "../application/use-cases/GetAllTrackingsUseCase";
import { UpdateTrackingStatusUseCase } from "../application/use-cases/UpdateTrackingStatusUseCase";
import { trackCorreios } from "../services/correios";
import { ITrackingRepository } from "../domain/repositories/ITrackingRepository";
import { hasNewEvents } from "../shared/utils/eventComparator";
import { ClassifiedError, ErrorType } from "../shared/utils/retry";

const container = DIContainer.getInstance();

/**
 * Controle de falhas consecutivas para implementar backoff
 */
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;    // Máximo de falhas antes de aumentar wait time
const FAILURE_WAIT_TIME = 60000;       // 1 minuto base de espera

/**
 * JOB PRINCIPAL - Execução padrão
 * Cron: *​/15 5-22 * * 1-6
 * Significa: A cada 15 minutos (0,15,30,45), das 5h às 22h, segunda a sábado
 */
cron.schedule("*/15 5-22 * * 1-6", () => processTrackings('NORMAL'));

/**
 * Processa rastreamentos pendentes
 *
 * Função principal que executa o ciclo completo de atualização:
 * 1. Busca rastreamentos pendentes
 * 2. Consulta API dos Correios para cada um
 * 3. Detecta mudanças de status ou novos eventos
 * 4. Atualiza banco de dados e envia notificações
 * 5. Registra métricas e erros
 *
 * Implementa estratégias de resiliência:
 * - Backoff exponencial em caso de falhas
 * - Não quebra fluxo se um rastreamento falhar
 * - Aguarda em caso de problemas críticos da API
 *
 * @param jobType - Tipo de execução ('NORMAL' ou 'PICO-EXTRA')
 */
async function processTrackings(jobType: 'NORMAL' | 'PICO-EXTRA') {
  const startTime = new Date();
  const startTimeFormatted = startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 [${jobType}] Job iniciado - ${startTimeFormatted}`);
  console.log(`${'='.repeat(70)}`);

  try {
    // Obter dependências do container
    const trackingRepository = container.getRepository<ITrackingRepository>('TrackingRepository');
    const updateTrackingStatusUseCase = container.getUseCase<UpdateTrackingStatusUseCase>('UpdateTrackingStatusUseCase');

    // Buscar apenas rastreamentos pendentes (não entregues)
    const trackings = await trackingRepository.findPendingTrackings();
    console.log(`📦 ${trackings.length} ${trackings.length === 1 ? 'tracking' : 'trackings'} ${jobType === 'PICO-EXTRA' ? '(verificação PICO)' : 'pendentes'} encontrado${trackings.length !== 1 ? 's' : ''}\n`);

    // Métricas da execução
    let successCount = 0;
    let errorCount = 0;
    let updatedCount = 0;
    let skippedCount = 0; // Trackings pulados por erro temporário

    // Resetar contador de falhas no início (sucesso anterior limpa falhas)
    consecutiveFailures = 0;

    // Processar cada rastreamento individualmente
    for (let tracking of trackings) {
      try {
        // Consultar API dos Correios (com retry automático)
        const trackingData = await trackCorreios(tracking.trackingCode);
        successCount++;

        // Resetar contador de falhas após sucesso
        consecutiveFailures = 0;

        // Detectar mudanças de status ou novos eventos
        const statusChanged = trackingData.status !== tracking.currentStatus;
        const eventsChanged = hasNewEvents(tracking.events, trackingData.events);

        // Atualizar apenas se houver mudanças (evita writes desnecessários)
        if (statusChanged || eventsChanged) {
          await updateTrackingStatusUseCase.execute({
            trackingCode: tracking.trackingCode,
            newStatus: trackingData.status as any,
            events: trackingData.events,
            dtExpected: trackingData.dtPrevista
          });

          updatedCount++;

          // Log específico baseado no tipo de mudança
          if (statusChanged) {
            console.log(`✅ ${tracking.trackingCode} | ${tracking.currentStatus} -> ${trackingData.status}`);
          } else {
            // Detectar e mostrar novos eventos
            const newEventsCount = trackingData.events.length - tracking.events.length;
            
            if (newEventsCount > 0) {
              console.log(`📋 ${tracking.trackingCode} | +${newEventsCount} novo${newEventsCount > 1 ? 's' : ''} evento${newEventsCount > 1 ? 's' : ''}`);
            } else {
              const latestEvent = trackingData.events[0];
              const latestEventDescription = latestEvent?.description || latestEvent?.status || 'Evento atualizado';
              console.log(`📋 ${tracking.trackingCode} | Eventos atualizados | ${latestEventDescription}`);
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        const isTemporary = error instanceof ClassifiedError && error.type === ErrorType.TEMPORARY;

        // Erros TEMPORÁRIOS: SKIP sem salvar (retry já foi tentado)
        if (isTemporary) {
          skippedCount++;
          console.warn(`⏭️ ${tracking.trackingCode} | Pulado (erro temporário após retry): ${errorMessage}`);

          // Não incrementar errorCount nem consecutiveFailures para erros temporários
          // Isso evita backoff desnecessário para problemas pontuais
          continue;
        }

        // Erros PERMANENTES ou DESCONHECIDOS: registrar e aplicar backoff
        errorCount++;
        consecutiveFailures++;

        // Log detalhado do erro
        console.error(`❌ ${tracking.trackingCode} | Erro permanente: ${errorMessage.substring(0, 50)}${errorMessage.length > 50 ? '...' : ''}`);

        // Estratégia de backoff: aguardar mais tempo após múltiplas falhas permanentes
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          // Backoff exponencial limitado a 5x o tempo base
          const waitTime = FAILURE_WAIT_TIME * Math.min(consecutiveFailures - MAX_CONSECUTIVE_FAILURES + 1, 5);
          console.log(`⏸️ Aguardando ${(waitTime/1000).toFixed(0)}s devido a ${consecutiveFailures} falhas consecutivas...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // Registrar métricas de conclusão
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ [${jobType}] Job concluído em ${durationSeconds}s`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`Total processados: ${trackings.length}`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros permanentes: ${errorCount}`);
    console.log(`⏭️ Erros temporários: ${skippedCount}`);
    console.log(`🔄 Atualizados: ${updatedCount}`);
    console.log(`⏱️ Duração: ${durationSeconds}s`);
    console.log(`${'='.repeat(70)}\n`);

  } catch (error) {
    // Erro crítico que impediu o job de executar
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    console.error(`\n${'='.repeat(70)}`);
    console.error(`⚠️ [${jobType}] ERRO CRÍTICO`);
    console.error(`${'─'.repeat(70)}`);
    console.error(`Mensagem: ${errorMessage}`);
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`${'='.repeat(70)}\n`);
  }
}

/**
 * JOB DE PICO - Execuções extras nos horários de maior atividade
 * Cron: 7,22,37,52 15-17 * * 1-6
 * Significa: Nos minutos 7,22,37,52, das 15h às 17h, segunda a sábado
 * Intercalado com job principal (0,15,30,45) para evitar overlap
 */
cron.schedule("7,22,37,52 15-17 * * 1-6", () => processTrackings('PICO-EXTRA'));

// Log de inicialização
console.log('\n' + '='.repeat(70));
console.log('🚀 JOBS DE TRACKING INICIADOS');
console.log('='.repeat(70));
console.log('📅 Job principal: Segunda a Sábado, 5h-22h, a cada 15min');
console.log('⏰ Job de pico: Segunda a Sábado, 15h-17h (intervalo de 15min)');
console.log('🛑 Domingos: Inativos');
console.log('='.repeat(70) + '\n');
