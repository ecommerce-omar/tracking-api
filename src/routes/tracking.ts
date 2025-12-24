/**
 * ROTAS DE RASTREAMENTO - PRESENTATION LAYER
 *
 * Define as rotas HTTP para operações relacionadas a rastreamentos.
 * Utiliza o Express Router para organizar endpoints em um módulo separado.
 *
 * Endpoints disponíveis:
 * - GET /:trackingCode - Busca rastreamento por código dos Correios
 *
 * Responsabilidades:
 * - Mapear URLs para métodos do controller
 * - Configurar middlewares específicos de rota (se necessário)
 * - Manter rotas organizadas e separadas por domínio
 *
 * Padrões aplicados:
 * - Router Pattern (Express)
 * - RESTful API Design
 * - Separation of Concerns
 */

import { Router } from "express";
import { TrackingController } from "../presentation/controllers/TrackingController";

const router = Router();
const trackingController = new TrackingController();

/**
 * GET /:trackingCode
 * Busca um rastreamento específico pelo código dos Correios
 * Exemplo: GET /tracking/AA123456789BR
 */
router.get("/:trackingCode", (req, res) => trackingController.getTrackingByTrackingCode(req, res));

export default router;
