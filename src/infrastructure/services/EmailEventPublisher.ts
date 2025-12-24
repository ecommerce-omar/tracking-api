/**
 * PUBLISHER DE EVENTOS DE EMAIL - INFRASTRUCTURE LAYER
 *
 * Implementa o padrão Publisher para eventos de mudança de status,
 * convertendo eventos de domínio em notificações por email para clientes.
 * Esta classe faz parte da camada de infraestrutura e implementa a
 * interface de domínio IEventPublisher.
 *
 * Responsabilidades:
 * - Receber eventos de mudança de status do domínio
 * - Filtrar eventos que não devem gerar notificações
 * - Enviar emails de notificação aos clientes
 * - Registrar logs de sucesso e erro
 * - Garantir que erros de email não quebrem o fluxo principal
 *
 * Regras de negócio:
 * - Não envia email para entregas em ponto de coleta (pickup-in-point)
 * - Clientes de pickup-in-point não recebem notificações automáticas
 * - Erros de email são logados mas não propagados
 *
 * Padrões aplicados:
 * - Publisher Pattern (Event-Driven Architecture)
 * - Dependency Inversion (implementa interface de domínio)
 * - Fail-Safe (erros não quebram fluxo principal)
 */

import { IEventPublisher } from "../../domain/services/IEventPublisher";
import { TrackingStatusChangedEvent } from "../../domain/events/TrackingStatusChangedEvent";
import { sendTrackingEmail } from "../../middlewares/emailSender";
import { logger } from "../../shared/utils/Logger";
import { DeliveryChannel, TrackingStatus } from "../../domain/types/TrackingTypes";

/**
 * Status que não devem disparar notificações por email
 * São mensagens informativas/técnicas dos Correios que não agregam valor ao cliente
 */
const SILENT_STATUSES: string[] = [
  TrackingStatus.DESCONSIDERAR_INFORMACAO,
  TrackingStatus.OBJETO_SERA_DEVOLVIDO,
  TrackingStatus.ETIQUETA_EXPIRADA,
  TrackingStatus.ENTREGUE_REMETENTE,
  TrackingStatus.SUSPENSAO_ENTREGA,
  TrackingStatus.OBJETO_NAO_CHEGOU_UNIDADE,
  TrackingStatus.CARTEIRO_SAIU_COLETA,
];

/**
 * Publisher que envia notificações por email quando o status muda
 */
export class EmailEventPublisher implements IEventPublisher {
  /**
   * Publica um evento de mudança de status
   *
   * Processa eventos de mudança de status e envia emails de notificação
   * aos clientes, exceto para entregas em ponto de coleta.
   *
   * @param event - Evento de mudança de status contendo dados do rastreamento
   * @throws Nunca lança erros (fail-safe), apenas loga
   */
  async publish(event: TrackingStatusChangedEvent): Promise<void> {
    try {
      // Regra de negócio: não enviar notificação se for pickup-in-point
      // Clientes que escolheram retirar em ponto de coleta não recebem emails automáticos
      if (event.deliveryChannel === DeliveryChannel.PICKUP_IN_POINT) {
        return;
      }

      // Regra de negócio: não enviar notificação para status informativos/técnicos
      // Mensagens como "desconsiderar informação anterior" não agregam valor ao cliente
      if (SILENT_STATUSES.includes(event.newStatus)) {
        return;
      }

      // Enviar email de notificação com os dados do evento
      await sendTrackingEmail({
        customer_name: event.customerName,
        email: event.customerEmail,
        tracking_code: event.trackingCode,
        products: event.products,
        status: event.newStatus,
        detail: event.detail,
        origin_unit: event.originUnit,
        destination_unit: event.destinationUnit,
        unit_address: event.unitAddress,
        unit_cep: event.unitCep,
      });
    } catch (error) {
      // Registrar erro no log com contexto completo
      logger.error(
        "Erro ao enviar email de mudança de status",
        error instanceof Error ? error : new Error(String(error)),
        {
          customerEmail: event.customerEmail,
          trackingCode: event.trackingCode,
          trackingId: event.trackingId,
          deliveryChannel: event.deliveryChannel,
        }
      );
      // IMPORTANTE: Não relançar o erro para não quebrar o fluxo principal
      // O rastreamento deve ser atualizado mesmo se o email falhar
    }
  }
}
