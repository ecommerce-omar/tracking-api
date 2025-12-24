/**
 * MIDDLEWARE DE TRATAMENTO DE ERROS - INFRASTRUCTURE LAYER
 *
 * Middleware global para capturar e tratar todos os erros da aplicação,
 * convertendo exceções em respostas HTTP apropriadas e registrando logs
 * detalhados para debugging e monitoramento.
 *
 * Responsabilidades:
 * - Capturar todas as exceções não tratadas nas rotas
 * - Classificar erros por tipo (validação, autenticação, etc.)
 * - Mapear erros para códigos HTTP apropriados
 * - Retornar respostas JSON padronizadas
 * - Registrar logs com contexto completo da requisição
 * - Ocultar detalhes técnicos do usuário final
 *
 * Tipos de erro tratados:
 * - 400: Validação de dados (ValidationError, ZodError)
 * - 401: Autenticação (token, unauthorized)
 * - 404: Recurso não encontrado
 * - 500: Erro de email
 * - 503: Erro de banco de dados
 * - 500: Erro genérico (fallback)
 *
 * Padrões aplicados:
 * - Error Handler Middleware Pattern (Express)
 * - Centralized Error Handling
 * - Logging Pattern
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/Logger';

/**
 * Middleware centralizado para tratamento de erros HTTP
 */
export class ErrorHandlerMiddleware {
  /**
   * Manipula erros capturados durante o processamento de requisições
   *
   * Este método é chamado automaticamente pelo Express quando um erro
   * é lançado ou passado para next(error) em qualquer rota ou middleware.
   *
   * @param error - Erro capturado
   * @param req - Objeto de requisição Express
   * @param res - Objeto de resposta Express
   * @param next - Função next do Express (não utilizada)
   */
  static handle(error: Error, req: Request, res: Response, next: NextFunction) {
    // Coletar contexto da requisição para logging
    const context = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.body,
      params: req.params,
      query: req.query
    };

    // Registrar erro com contexto completo
    logger.error('HTTP Error occurred', error, context);

    // Classificar e responder baseado no tipo de erro

    // Erro de validação (dados de entrada inválidos)
    if (error.name === 'ValidationError' || error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Erro de recurso não encontrado
    if (error.message.includes('não encontrado') || error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Recurso não encontrado',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Erro de autorização
    if (error.message.includes('unauthorized') || error.message.includes('não autorizado')) {
      return res.status(401).json({
        error: 'Não autorizado',
        message: 'Acesso negado',
        timestamp: new Date().toISOString()
      });
    }

    // Erro de token/autenticação
    if (error.message.includes('token') || error.message.includes('authentication')) {
      return res.status(401).json({
        error: 'Token inválido ou expirado',
        message: 'Falha na autenticação',
        timestamp: new Date().toISOString()
      });
    }

    // Erro de envio de email
    if (error.message.includes('email') || error.message.includes('Email')) {
      return res.status(500).json({
        error: 'Erro ao enviar email',
        message: 'Falha no envio de notificação por email',
        timestamp: new Date().toISOString()
      });
    }

    // Erro de banco de dados ou conexão
    if (error.message.includes('database') || error.message.includes('connection')) {
      return res.status(503).json({
        error: 'Serviço temporariamente indisponível',
        message: 'Problemas com o banco de dados',
        timestamp: new Date().toISOString()
      });
    }

    // Erro genérico (fallback para erros não classificados)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro inesperado',
      timestamp: new Date().toISOString()
    });
  }
}
