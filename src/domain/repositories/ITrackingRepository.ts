/**
 * INTERFACE DO REPOSITÓRIO DE RASTREAMENTO - DOMAIN LAYER
 *
 * Define o contrato para acesso aos dados de rastreamento seguindo o padrão
 * Repository do Domain-Driven Design (DDD). Esta interface pertence à camada
 * de domínio mas será implementada na camada de infraestrutura.
 *
 * Responsabilidades:
 * - Abstrair o acesso aos dados de rastreamento
 * - Definir operações de consulta e persistência
 * - Permitir diferentes implementações (banco de dados, cache, mock, etc.)
 * - Manter o domínio independente da infraestrutura
 *
 * Padrões aplicados:
 * - Repository Pattern (DDD)
 * - Dependency Inversion Principle (SOLID)
 * - Interface Segregation Principle (SOLID)
 */

import { TrackingEntity } from '../entities/Tracking';
import { TrackingCategory, TrackingStatus, TrackingEvent } from '../types/TrackingTypes';

/**
 * Interface que define as operações de persistência para rastreamentos
 */
export interface ITrackingRepository {
  /**
   * Busca um rastreamento pelo ID do banco de dados
   *
   * @param id - ID único do rastreamento
   * @returns TrackingEntity se encontrado, null caso contrário
   */
  findById(id: string): Promise<TrackingEntity | null>;

  /**
   * Busca um rastreamento pelo código de rastreamento dos Correios
   *
   * @param trackingCode - Código de rastreamento (13 caracteres)
   * @returns TrackingEntity se encontrado, null caso contrário
   */
  findByTrackingCode(trackingCode: string): Promise<TrackingEntity | null>;

  /**
   * Retorna todos os rastreamentos cadastrados
   *
   * @returns Array com todos os rastreamentos
   */
  findAll(): Promise<TrackingEntity[]>;

  /**
   * Busca rastreamentos por categoria de envio
   *
   * @param category - Categoria de envio (SEDEX ou PAC)
   * @returns Array com rastreamentos da categoria especificada
   */
  findByCategory(category: TrackingCategory): Promise<TrackingEntity[]>;

  /**
   * Busca rastreamentos que ainda não foram entregues
   *
   * Retorna apenas rastreamentos com status diferentes de "Entregue".
   * Usado pelo job de atualização automática.
   *
   * @returns Array com rastreamentos pendentes
   */
  findPendingTrackings(): Promise<TrackingEntity[]>;

  /**
   * Atualiza o status de um rastreamento
   *
   * Atualiza o status atual, adiciona novos eventos ao histórico e
   * opcionalmente atualiza a data prevista de entrega.
   *
   * @param trackingCode - Código de rastreamento a ser atualizado
   * @param status - Novo status do rastreamento
   * @param events - Eventos atualizados do rastreamento
   * @param dtExpected - Data prevista de entrega (opcional)
   * @returns TrackingEntity atualizado
   * @throws Error se o rastreamento não for encontrado
   */
  updateStatus(trackingCode: string, status: TrackingStatus, events: TrackingEvent[], dtExpected?: string): Promise<TrackingEntity>;
}
