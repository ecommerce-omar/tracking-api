/**
 * CONTROLLER DE RASTREAMENTO - PRESENTATION LAYER
 *
 * Controller responsável por gerenciar as requisições HTTP relacionadas
 * a rastreamentos. Atua como intermediário entre as rotas HTTP e a
 * lógica de negócio (casos de uso).
 *
 * Responsabilidades:
 * - Receber requisições HTTP e extrair parâmetros
 * - Validar dados de entrada usando schemas Zod
 * - Delegar operações aos repositórios/casos de uso
 * - Converter entidades de domínio em respostas JSON
 * - Tratar erros e retornar códigos HTTP apropriados
 * - Manter controllers magros (thin controllers)
 *
 * Endpoints gerenciados:
 * - GET /trackings - Lista todos os rastreamentos
 * - GET /trackings/:trackingCode - Busca por código
 * - GET /trackings/category/:category - Busca por categoria
 *
 * Padrões aplicados:
 * - Controller Pattern (MVC)
 * - Dependency Injection (via DIContainer)
 * - Input Validation (Zod schemas)
 * - Separation of Concerns
 */

import { Request, Response } from 'express';
import { DIContainer } from '../../infrastructure/container/DIContainer';
import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';
import { TrackingEntity } from '../../domain/entities/Tracking';
import { TrackingCategory } from '../../domain/types/TrackingTypes';
import { trackingCodeSchema } from '../../schemas/trackingSchema';
import { trackingCategorySchema } from '../../schemas/trackingSchema';

/**
 * Controller para operações de rastreamento
 */
export class TrackingController {
  private container = DIContainer.getInstance();

  /**
   * Lista todos os rastreamentos cadastrados
   *
   * Endpoint: GET /trackings
   *
   * @param req - Requisição Express
   * @param res - Resposta Express
   * @returns JSON array com todos os rastreamentos
   */
  async getAllTrackings(req: Request, res: Response): Promise<void> {
    try {
      // Obter repositório via container de DI
      const trackingRepository = this.container.getRepository<ITrackingRepository>('TrackingRepository');
      const trackings = await trackingRepository.findAll();

      // Converter entidades para objetos simples e retornar
      res.json(trackings.map((tracking: TrackingEntity) => tracking.toPlainObject()));
    } catch (error) {
      console.error("Erro ao listar rastreamentos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  /**
   * Busca um rastreamento específico pelo código
   *
   * Endpoint: GET /trackings/:trackingCode
   *
   * @param req - Requisição Express (contém trackingCode nos params)
   * @param res - Resposta Express
   * @returns JSON com dados do rastreamento ou erro 404
   */
  async getTrackingByTrackingCode(req: Request, res: Response): Promise<void> {
    try {
      const { trackingCode } = req.params;

      // Validar formato do código de rastreamento usando Zod
      const validation = trackingCodeSchema.safeParse({ trackingCode });
      if (!validation.success) {
        res.status(400).json({
          error: "Código de rastreamento inválido",
          details: validation.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      // Buscar rastreamento no repositório
      const trackingRepository = this.container.getRepository<ITrackingRepository>('TrackingRepository');
      const tracking = await trackingRepository.findByTrackingCode(trackingCode);

      // Retornar 404 se não encontrado
      if (!tracking) {
        res.status(404).json({ error: "Rastreamento não encontrado" });
        return;
      }

      // Retornar rastreamento encontrado
      res.json(tracking.toPlainObject());
    } catch (error) {
      console.error("Erro ao buscar rastreamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  /**
   * Busca rastreamentos filtrados por categoria
   *
   * Endpoint: GET /trackings/category/:category
   * Categorias válidas: 'sedex' ou 'pac'
   *
   * @param req - Requisição Express (contém category nos params)
   * @param res - Resposta Express
   * @returns JSON com rastreamentos da categoria e contagem
   */
  async getTrackingsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;

      // Validar categoria usando Zod
      const validation = trackingCategorySchema.safeParse(category);
      if (!validation.success) {
        res.status(400).json({
          error: "Categoria inválida. Use 'sedex' ou 'pac'",
          details: validation.error.issues.map(err => ({
            field: 'category',
            message: err.message
          }))
        });
        return;
      }

      // Buscar rastreamentos da categoria
      const trackingRepository = this.container.getRepository<ITrackingRepository>('TrackingRepository');
      const trackings = await trackingRepository.findByCategory(category as TrackingCategory);

      // Retornar com metadados (categoria e contagem)
      res.json({
        category: category,
        count: trackings.length,
        trackings: trackings.map((tracking: TrackingEntity) => tracking.toPlainObject())
      });
    } catch (error) {
      console.error("Erro ao buscar rastreamentos por categoria:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}