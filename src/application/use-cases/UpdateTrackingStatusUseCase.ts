/**
 * CASO DE USO: ATUALIZAR STATUS DO RASTREAMENTO - APPLICATION LAYER
 *
 * Implementa a lógica de negócio para atualizar o status de um rastreamento
 * e notificar o cliente quando houver mudanças. Este é um dos casos de uso
 * mais importantes do sistema, responsável por manter os dados sincronizados
 * com os Correios e enviar notificações por email.
 *
 * Responsabilidades:
 * - Buscar rastreamento atual no repositório
 * - Detectar mudanças de status
 * - Atualizar status e eventos no banco de dados
 * - Publicar evento de mudança de status (dispara email)
 * - Coordenar operações entre repositório e publisher
 *
 * Fluxo de execução:
 * 1. Buscar rastreamento atual pelo código
 * 2. Verificar se o status mudou
 * 3. Atualizar status no repositório
 * 4. Se mudou, publicar evento para enviar email
 * 5. Retornar rastreamento atualizado
 *
 * Padrões aplicados:
 * - Use Case Pattern (Clean Architecture)
 * - Dependency Injection (recebe dependências via construtor)
 * - Event-Driven Architecture (publica eventos de domínio)
 * - Single Responsibility Principle (SOLID)
 */

import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';
import { IEventPublisher } from '../../domain/services/IEventPublisher';
import { TrackingEntity } from '../../domain/entities/Tracking';
import { TrackingStatusChangedEventEntity } from '../../domain/events/TrackingStatusChangedEvent';
import { UpdateTrackingStatusRequest, UpdateTrackingStatusResponse } from '../types/UseCaseTypes';
import { TrackingStatus } from '../../domain/types/TrackingTypes';
import { hasNewEvents } from '../../shared/utils/eventComparator';

/**
 * Caso de uso para atualizar status de rastreamento
 */
export class UpdateTrackingStatusUseCase {
  /**
   * Construtor com injeção de dependências
   *
   * @param trackingRepository - Repositório para persistência (injetado via DI)
   * @param eventPublisher - Publisher para notificações (injetado via DI)
   */
  constructor(
    private readonly trackingRepository: ITrackingRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  /**
   * Executa o caso de uso de atualização de status
   *
   * Coordena a atualização do status do rastreamento e o envio de notificações.
   * Garante que o email só seja enviado quando houver mudança real de status.
   *
   * @param request - Dados da requisição de atualização
   * @param request.trackingCode - Código de rastreamento a ser atualizado
   * @param request.newStatus - Novo status do rastreamento
   * @param request.events - Histórico completo de eventos
   * @param request.dtExpected - Data prevista de entrega (opcional)
   * @returns Objeto contendo o rastreamento atualizado e flag de mudança
   * @throws Error se o rastreamento não for encontrado
   */
  async execute(request: UpdateTrackingStatusRequest): Promise<UpdateTrackingStatusResponse> {
    // 1. Buscar rastreamento atual pelo código
    const currentTracking = await this.trackingRepository.findByTrackingCode(request.trackingCode);

    if (!currentTracking) {
      throw new Error('Tracking não encontrado');
    }

    // 2. Verificar se houve mudança de status ou novos eventos
    // Importante para notificar cliente de todas as movimentações, inclusive transferências
    const statusChanged = currentTracking.hasStatusChanged(request.newStatus);
    const eventsChanged = hasNewEvents(currentTracking.events, request.events);

    // 3. Atualizar status no repositório (sempre atualiza, mesmo sem mudança de status)
    // Isso garante que novos eventos sejam salvos mesmo que o status seja o mesmo
    const updatedTracking = await this.trackingRepository.updateStatus(
      request.trackingCode,
      request.newStatus,
      request.events,
      request.dtExpected
    );

    // 4. Publicar evento de mudança de status ou novos eventos (dispara email)
    // Notifica se houve mudança de status OU se há novos eventos
    // Isso garante que transferências com mesmo status também gerem notificação
    if (statusChanged || eventsChanged) {
      const event = TrackingStatusChangedEventEntity.fromTracking(currentTracking, request.newStatus, request.events);
      await this.eventPublisher.publish(event.toPlainObject());
    }

    // 5. Retornar resultado da operação
    return {
      tracking: updatedTracking,
      statusChanged
    };
  }
}
