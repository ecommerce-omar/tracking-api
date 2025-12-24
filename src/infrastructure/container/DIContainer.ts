/**
 * CONTAINER DE INJEÇÃO DE DEPENDÊNCIAS - INFRASTRUCTURE LAYER
 *
 * Implementa o padrão Dependency Injection Container (DI Container) para
 * gerenciar a criação e ciclo de vida das dependências do sistema.
 * Centraliza a configuração de todas as dependências da aplicação.
 *
 * Responsabilidades:
 * - Criar e manter instâncias de repositórios, serviços e casos de uso
 * - Resolver dependências entre componentes
 * - Garantir que cada componente receba suas dependências corretamente
 * - Fornecer acesso centralizado a todas as dependências
 * - Implementar padrão Singleton para o próprio container
 *
 * Estrutura de dependências:
 * 1. Repositories: Acesso a dados (DatabaseTrackingRepository)
 * 2. Services: Serviços de infraestrutura (EmailEventPublisher)
 * 3. Use Cases: Lógica de aplicação (recebem repositories e services)
 *
 * Padrões aplicados:
 * - Dependency Injection Pattern
 * - Service Locator Pattern
 * - Singleton Pattern
 * - Inversion of Control (IoC)
 */

import { DatabaseTrackingRepository } from '../repositories/DatabaseTrackingRepository';
import { EmailEventPublisher } from '../services/EmailEventPublisher';
import { UpdateTrackingStatusUseCase } from '../../application/use-cases/UpdateTrackingStatusUseCase';
import { GetAllTrackingsUseCase } from '../../application/use-cases/GetAllTrackingsUseCase';
import { GetTrackingsByCategoryUseCase } from '../../application/use-cases/GetTrackingsByCategoryUseCase';

/**
 * Container de Injeção de Dependências
 *
 * Gerencia todas as dependências da aplicação em um único lugar.
 */
export class DIContainer {
  private static instance: DIContainer;
  private repositories: Map<string, any> = new Map();
  private services: Map<string, any> = new Map();
  private useCases: Map<string, any> = new Map();

  /**
   * Construtor privado para implementar Singleton
   *
   * Inicializa todas as dependências na ordem correta:
   * 1. Repositories (sem dependências)
   * 2. Services (sem dependências)
   * 3. Use Cases (dependem de repositories e services)
   */
  private constructor() {
    this.initializeRepositories();
    this.initializeServices();
    this.initializeUseCases();
  }

  /**
   * Retorna a instância única do container (Singleton)
   *
   * @returns Instância única do DIContainer
   */
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Inicializa os repositórios
   *
   * Repositories são responsáveis pelo acesso aos dados.
   * Não possuem dependências de outros componentes.
   */
  private initializeRepositories(): void {
    this.repositories.set('TrackingRepository', new DatabaseTrackingRepository());
  }

  /**
   * Inicializa os serviços de infraestrutura
   *
   * Services implementam funcionalidades de infraestrutura
   * como envio de email, logging, etc.
   */
  private initializeServices(): void {
    this.services.set('EventPublisher', new EmailEventPublisher());
  }

  /**
   * Inicializa os casos de uso
   *
   * Use Cases orquestram a lógica de negócio e dependem de
   * repositories e services. Aqui é onde as dependências são
   * injetadas nos construtores.
   */
  private initializeUseCases(): void {
    const trackingRepository = this.repositories.get('TrackingRepository');
    const eventPublisher = this.services.get('EventPublisher');

    // Caso de uso para atualizar status (precisa de repository e publisher)
    this.useCases.set('UpdateTrackingStatusUseCase',
      new UpdateTrackingStatusUseCase(trackingRepository, eventPublisher)
    );

    // Caso de uso para listar todos (precisa apenas de repository)
    this.useCases.set('GetAllTrackingsUseCase',
      new GetAllTrackingsUseCase(trackingRepository)
    );

    // Caso de uso para buscar por categoria (precisa apenas de repository)
    this.useCases.set('GetTrackingsByCategoryUseCase',
      new GetTrackingsByCategoryUseCase(trackingRepository)
    );
  }

  /**
   * Recupera um repositório pelo nome
   *
   * @param name - Nome do repositório registrado
   * @returns Instância do repositório
   */
  getRepository<T>(name: string): T {
    return this.repositories.get(name);
  }

  /**
   * Recupera um serviço pelo nome
   *
   * @param name - Nome do serviço registrado
   * @returns Instância do serviço
   */
  getService<T>(name: string): T {
    return this.services.get(name);
  }

  /**
   * Recupera um caso de uso pelo nome
   *
   * @param name - Nome do caso de uso registrado
   * @returns Instância do caso de uso
   */
  getUseCase<T>(name: string): T {
    return this.useCases.get(name);
  }
}
