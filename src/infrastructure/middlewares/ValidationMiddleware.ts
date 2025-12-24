import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware de Validação usando Zod
 *
 * Valida dados de entrada (body, params, query) usando schemas Zod
 * e retorna erros estruturados em caso de falha na validação
 */
export class ValidationMiddleware {
  /**
   * Valida o body da requisição
   * @param schema - Schema Zod para validação
   */
  static validate(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validation = schema.safeParse(req.body);

        if (!validation.success) {
          return res.status(400).json({
            error: 'Dados de entrada inválidos',
            details: validation.error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }

        // Sobrescreve req.body com dados validados e tipados
        req.body = validation.data;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Valida os parâmetros da URL (req.params)
   * @param schema - Schema Zod para validação
   */
  static validateParams(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validation = schema.safeParse(req.params);

        if (!validation.success) {
          return res.status(400).json({
            error: 'Parâmetros inválidos',
            details: validation.error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }

        // NOTA: Type assertion necessária aqui devido à limitação do tipo ParamsDictionary do Express
        // que não aceita objetos validados dinamicamente. Os dados já foram validados pelo Zod.
        req.params = validation.data as typeof req.params;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
