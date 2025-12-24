/**
 * UTILITÁRIO DE RETRY COM BACKOFF EXPONENCIAL
 *
 * Fornece funções auxiliares para implementar retry automático
 * em operações que podem falhar temporariamente.
 */

/**
 * Classificação de erros
 */
export enum ErrorType {
  TEMPORARY = 'temporary',  // Erro temporário (deve fazer retry)
  PERMANENT = 'permanent'   // Erro permanente (não deve fazer retry)
}

/**
 * Erro customizado com classificação
 */
export class ClassifiedError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ClassifiedError';
  }
}

/**
 * Opções de configuração do retry
 */
export interface RetryOptions {
  maxAttempts?: number;      // Número máximo de tentativas (padrão: 3)
  initialDelay?: number;     // Delay inicial em ms (padrão: 1000)
  maxDelay?: number;         // Delay máximo em ms (padrão: 10000)
  backoffMultiplier?: number; // Multiplicador do backoff (padrão: 2)
  onRetry?: (attempt: number, error: Error) => void; // Callback chamado antes de cada retry
}

/**
 * Executa uma função com retry automático
 *
 * @param fn - Função assíncrona para executar
 * @param options - Opções de configuração do retry
 * @returns Resultado da função ou lança erro após todas as tentativas
 *
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   async () => await fetchAPI(),
 *   {
 *     maxAttempts: 3,
 *     onRetry: (attempt) => console.log(`Tentativa ${attempt}`)
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Se for um ClassifiedError do tipo PERMANENT, não fazer retry
      if (error instanceof ClassifiedError && error.type === ErrorType.PERMANENT) {
        throw error;
      }

      // Se for a última tentativa, lançar o erro
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calcular delay com backoff exponencial
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      // Chamar callback se fornecido
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Nunca deve chegar aqui, mas TypeScript precisa dessa garantia
  throw lastError!;
}

/**
 * Classifica um erro HTTP baseado no status code
 *
 * @param statusCode - Código de status HTTP
 * @param message - Mensagem de erro
 * @returns ClassifiedError com tipo apropriado
 */
export function classifyHttpError(statusCode: number, message: string): ClassifiedError {
  // Erros temporários (servidor)
  if (statusCode === 429 || // Rate limiting
      statusCode === 500 || // Internal server error
      statusCode === 502 || // Bad gateway
      statusCode === 503 || // Service unavailable
      statusCode === 504) { // Gateway timeout
    return new ClassifiedError(
      message,
      ErrorType.TEMPORARY
    );
  }

  // Erros de autenticação (podem ser temporários se for token expirado)
  if (statusCode === 401 || statusCode === 403) {
    return new ClassifiedError(
      message,
      ErrorType.TEMPORARY
    );
  }

  // Erros do cliente (permanentes)
  if (statusCode === 400 || // Bad request
      statusCode === 404 || // Not found
      statusCode === 422) { // Unprocessable entity
    return new ClassifiedError(
      message,
      ErrorType.PERMANENT
    );
  }

  // Outros erros são considerados temporários por padrão
  return new ClassifiedError(
    message,
    ErrorType.TEMPORARY
  );
}

/**
 * Classifica um erro de rede ou timeout
 *
 * @param error - Erro original
 * @returns ClassifiedError temporário
 */
export function classifyNetworkError(error: Error): ClassifiedError {
  return new ClassifiedError(
    `Erro de rede: ${error.message}`,
    ErrorType.TEMPORARY,
    error
  );
}
