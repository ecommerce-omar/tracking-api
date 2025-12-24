/**
 * CASO DE USO: BUSCAR RASTREAMENTOS POR CATEGORIA - APPLICATION LAYER
 *
 * Implementa a lógica de negócio para recuperar rastreamentos filtrados
 * por categoria de envio (SEDEX ou PAC). Este caso de uso permite que
 * o sistema consulte encomendas agrupadas por tipo de serviço postal.
 *
 * Responsabilidades:
 * - Orquestrar a busca de rastreamentos por categoria
 * - Validar a categoria fornecida (delegado ao TypeScript)
 * - Delegar a operação de consulta ao repositório
 * - Retornar entidades de domínio filtradas
 *
 * Casos de uso:
 * - Listar todas as encomendas SEDEX (entregas rápidas)
 * - Listar todas as encomendas PAC (entregas econômicas)
 * - Gerar relatórios por tipo de serviço
 *
 * Padrões aplicados:
 * - Use Case Pattern (Clean Architecture)
 * - Dependency Injection (recebe dependências via construtor)
 * - Single Responsibility Principle (SOLID)
 */

import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';
import { TrackingEntity } from '../../domain/entities/Tracking';
import { TrackingCategory } from '../../domain/types/TrackingTypes';

/**
 * Caso de uso para buscar rastreamentos por categoria
 */
export class GetTrackingsByCategoryUseCase {
  /**
   * Construtor com injeção de dependência
   *
   * @param trackingRepository - Repositório de rastreamentos (injetado via DI)
   */
  constructor(
    private readonly trackingRepository: ITrackingRepository
  ) {}

  /**
   * Executa o caso de uso
   *
   * Busca todos os rastreamentos que pertencem à categoria especificada.
   *
   * @param category - Categoria de envio (SEDEX ou PAC)
   * @returns Array com rastreamentos da categoria especificada
   */
  async execute(category: TrackingCategory): Promise<TrackingEntity[]> {
    return await this.trackingRepository.findByCategory(category);
  }
}