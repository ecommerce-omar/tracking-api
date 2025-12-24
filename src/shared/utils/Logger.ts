/**
 * SISTEMA DE LOGGING - SHARED UTILS
 *
 * Logger centralizado para registro estruturado de logs em toda a aplicação.
 * Fornece níveis de log (ERROR, WARN, INFO, DEBUG), formatação padronizada,
 * e sanitização automática de dados sensíveis.
 *
 * Responsabilidades:
 * - Registrar eventos do sistema com níveis apropriados
 * - Formatar logs de forma consistente e estruturada
 * - Sanitizar dados sensíveis (CPF, email, tokens, senhas)
 * - Adicionar timestamp e contexto aos logs
 * - Incluir stack traces de erros
 * - Fornecer interface única para logging
 *
 * Níveis de log:
 * - ERROR: Erros críticos que precisam atenção imediata
 * - WARN: Avisos sobre situações potencialmente problemáticas
 * - INFO: Informações gerais sobre operações do sistema
 * - DEBUG: Informações detalhadas para debugging
 *
 * Características:
 * - Singleton Pattern (instância única)
 * - Sanitização automática de dados sensíveis
 * - Suporte a contexto adicional (metadados)
 * - Formato estruturado e legível
 *
 * Padrões aplicados:
 * - Singleton Pattern
 * - Structured Logging
 * - Data Sanitization
 * - Context Logging
 */

/**
 * Níveis de severidade dos logs
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

/**
 * Estrutura de uma entrada de log
 */
export interface LogEntry {
  timestamp: string;              // ISO string da data/hora
  level: LogLevel;                // Nível de severidade
  message: string;                // Mensagem principal do log
  context?: Record<string, any>;  // Dados adicionais de contexto
  error?: Error;                  // Objeto de erro (para logs de erro)
}

/**
 * Logger centralizado do sistema
 *
 * Implementa padrão Singleton para garantir uma única instância
 * de logger em toda a aplicação.
 */
export class Logger {
  private static instance: Logger;

  /**
   * Construtor privado para implementar Singleton
   */
  private constructor() {}

  /**
   * Retorna a instância única do Logger (Singleton)
   *
   * @returns Instância única do Logger
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Formata uma entrada de log em string legível
   *
   * Formato: [timestamp] [level] message | Context: {...} | Error: {...}
   *
   * @param entry - Entrada de log a ser formatada
   * @returns String formatada para output
   */
  private formatLogEntry(entry: LogEntry): string {
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` | Error: ${entry.error.stack || entry.error.message}` : '';

    return `[${entry.timestamp}] [${entry.level}] ${entry.message}${contextStr}${errorStr}`;
  }

  /**
   * Cria uma entrada de log estruturada
   *
   * Adiciona timestamp automático e sanitiza contexto.
   *
   * @param level - Nível do log
   * @param message - Mensagem principal
   * @param context - Contexto adicional (opcional)
   * @param error - Objeto de erro (opcional)
   * @returns Entrada de log estruturada
   */
  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error
    };
  }

  /**
   * Sanitiza dados sensíveis do contexto
   *
   * Remove ou ofusca informações sensíveis como senhas, tokens,
   * CPF, email, etc. Isso evita vazamento de dados em logs.
   *
   * Dados sanitizados:
   * - password: Senhas
   * - token: Tokens de autenticação
   * - cpf: CPF do cliente
   * - email: Email do cliente
   * - authorization: Headers de autorização
   *
   * @param context - Contexto original
   * @returns Contexto sanitizado com dados sensíveis removidos
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };

    // Lista de palavras-chave que indicam dados sensíveis
    const sensitiveKeys = ['password', 'token', 'cpf', 'email', 'authorization'];

    // Substituir valores de campos sensíveis por [REDACTED]
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Registra um log de ERRO
   *
   * Usado para erros críticos que precisam atenção imediata.
   * Inclui stack trace completo se disponível.
   *
   * @param message - Mensagem descritiva do erro
   * @param error - Objeto Error (opcional)
   * @param context - Contexto adicional (opcional)
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    console.error(this.formatLogEntry(entry));
  }

  /**
   * Registra um log de AVISO
   *
   * Usado para situações que merecem atenção mas não são críticas.
   *
   * @param message - Mensagem de aviso
   * @param context - Contexto adicional (opcional)
   */
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    console.warn(this.formatLogEntry(entry));
  }

  /**
   * Registra um log INFORMATIVO
   *
   * Usado para informações gerais sobre operações do sistema.
   *
   * @param message - Mensagem informativa
   * @param context - Contexto adicional (opcional)
   */
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    console.log(this.formatLogEntry(entry));
  }

  /**
   * Registra um log de DEBUG
   *
   * Usado para informações detalhadas úteis durante desenvolvimento
   * e debugging.
   *
   * @param message - Mensagem de debug
   * @param context - Contexto adicional (opcional)
   */
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    console.log(this.formatLogEntry(entry));
  }
}

/**
 * Instância singleton do logger exportada para uso em toda aplicação
 *
 * Uso:
 * import { logger } from './shared/utils/Logger';
 * logger.info('Operação bem-sucedida', { userId: 123 });
 * logger.error('Falha na operação', error, { context: 'payment' });
 */
export const logger = Logger.getInstance();