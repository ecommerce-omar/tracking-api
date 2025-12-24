/**
 * CASO DE USO: LISTAR TODOS OS RASTREAMENTOS - APPLICATION LAYER
 *
 * Implementa a lógica de negócio para recuperar todos os rastreamentos
 * cadastrados no sistema. Este caso de uso segue os princípios da Clean
 * Architecture, isolando a lógica de aplicação das camadas de apresentação
 * e infraestrutura.
 *
 * Responsabilidades:
 * - Orquestrar a busca de todos os rastreamentos
 * - Delegar a operação de persistência ao repositório
 * - Retornar entidades de domínio para a camada de apresentação
 *
 * Padrões aplicados:
 * - Use Case Pattern (Clean Architecture)
 * - Dependency Injection (recebe dependências via construtor)
 * - Single Responsibility Principle (SOLID)
 */

import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';
import { TrackingEntity } from '../../domain/entities/Tracking';

/**
 * Caso de uso para listar todos os rastreamentos
 */
export class GetAllTrackingsUseCase {
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
   * Busca todos os rastreamentos no repositório e retorna como entidades.
   * Não aplica filtros ou transformações adicionais.
   *
   * @returns Array com todas as entidades de rastreamento
   */
  async execute(): Promise<TrackingEntity[]> {
    return await this.trackingRepository.findAll();
  }
}