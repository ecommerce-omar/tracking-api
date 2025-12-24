/**
 * ENTIDADE DE RASTREAMENTO - DOMAIN LAYER
 *
 * Representa a entidade principal de rastreamento de encomendas seguindo os princípios
 * do Domain-Driven Design (DDD). Esta entidade encapsula todas as regras de negócio
 * relacionadas ao rastreamento de pedidos.
 *
 * Responsabilidades:
 * - Manter a integridade dos dados de rastreamento
 * - Fornecer métodos para criar e converter objetos de rastreamento
 * - Validar mudanças de status
 * - Servir como modelo de domínio central do sistema
 *
 * Padrões aplicados:
 * - Entity Pattern (DDD)
 * - Factory Method (método estático create)
 * - Data Transfer Object (método toPlainObject)
 */

import { TrackingData, TrackingEvent, TrackingStatus, TrackingCategory, DeliveryChannel, Product } from '../types/TrackingTypes';

/**
 * ENTIDADE DE RASTREAMENTO
 *
 * Classe que representa uma encomenda rastreada no sistema.
 * Contém informações sobre o pedido, cliente, status atual e histórico de eventos.
 */
export class TrackingEntity {
  /**
   * Construtor da entidade de rastreamento
   *
   * @param id - Identificador único do rastreamento no banco de dados
   * @param orderId - Número do pedido no sistema de vendas
   * @param name - Nome completo do cliente destinatário
   * @param cpf - CPF do cliente (apenas números)
   * @param email - Email do cliente para notificações
   * @param contact - Telefone de contato do cliente (opcional)
   * @param trackingCode - Código de rastreamento dos Correios (13 caracteres)
   * @param currentStatus - Status atual da encomenda
   * @param category - Categoria da entrega (SEDEX ou PAC)
   * @param deliveryChannel - Canal de entrega (domicílio ou ponto de coleta)
   * @param products - Lista de produtos contidos na encomenda
   * @param quantity - Quantidade total de itens
   * @param events - Histórico de eventos de rastreamento
   * @param createdAt - Data/hora de criação do registro
   * @param updatedAt - Data/hora da última atualização
   * @param dtExpected - Data prevista de entrega (opcional)
   * @param sender - Remetente da encomenda (opcional)
   */
  constructor(
    public readonly id: string | undefined,
    public readonly orderId: number,
    public readonly name: string,
    public readonly cpf: string,
    public readonly email: string,
    public readonly contact: number | undefined,
    public readonly trackingCode: string,
    public readonly currentStatus: TrackingStatus,
    public readonly category: TrackingCategory,
    public readonly deliveryChannel: DeliveryChannel,
    public readonly products: Product[],
    public readonly quantity: number,
    public readonly events: TrackingEvent[],
    public readonly createdAt: string | undefined,
    public readonly updatedAt: string | undefined,
    public readonly dtExpected?: string | undefined,
    public readonly sender?: string | undefined
  ) {}

  /**
   * Factory Method para criar uma entidade a partir de dados simples
   *
   * Converte um objeto TrackingData (formato do banco de dados com snake_case)
   * em uma instância de TrackingEntity (formato do domínio com camelCase).
   *
   * @param data - Dados de rastreamento em formato de banco de dados
   * @returns Nova instância de TrackingEntity
   */
  static create(data: TrackingData): TrackingEntity {
    return new TrackingEntity(
      data.id,
      data.order_id,
      data.name,
      data.cpf,
      data.email,
      data.contact,
      data.tracking_code,
      data.current_status as TrackingStatus,
      data.category as TrackingCategory,
      data.delivery_channel as DeliveryChannel,
      data.products,
      data.quantity,
      data.events,
      data.created_at,
      data.updated_at,
      data.dt_expected,
      data.sender
    );
  }

  /**
   * Converte a entidade em um objeto simples
   *
   * Transforma a instância de TrackingEntity em um objeto TrackingData
   * no formato esperado pelo banco de dados (snake_case).
   * Útil para persistência e serialização.
   *
   * @returns Objeto TrackingData no formato do banco de dados
   */
  toPlainObject(): TrackingData {
    return {
      id: this.id,
      order_id: this.orderId,
      name: this.name,
      cpf: this.cpf,
      email: this.email,
      contact: this.contact,
      tracking_code: this.trackingCode,
      current_status: this.currentStatus,
      category: this.category,
      delivery_channel: this.deliveryChannel,
      products: this.products,
      quantity: this.quantity,
      events: this.events,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      dt_expected: this.dtExpected,
      sender: this.sender
    };
  }

  /**
   * Verifica se houve mudança de status
   *
   * Compara o status atual da entidade com um novo status fornecido.
   * Usado para determinar se uma notificação deve ser enviada ao cliente.
   *
   * @param newStatus - Novo status a ser comparado
   * @returns true se o status mudou, false caso contrário
   */
  hasStatusChanged(newStatus: TrackingStatus): boolean {
    return this.currentStatus !== newStatus;
  }
}
