import { retryWithBackoff, classifyHttpError, classifyNetworkError, ErrorType, ClassifiedError } from '../retry';

describe('Retry Utility', () => {
  describe('retryWithBackoff', () => {
    it('deve retornar sucesso na primeira tentativa', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve fazer retry em caso de erro temporário', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('deve falhar após todas as tentativas', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          initialDelay: 10
        })
      ).rejects.toThrow('Persistent error');

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('não deve fazer retry para erros permanentes', async () => {
      const permanentError = new ClassifiedError('Not found', ErrorType.PERMANENT);
      const fn = jest.fn().mockRejectedValue(permanentError);

      await expect(
        retryWithBackoff(fn, { maxAttempts: 3 })
      ).rejects.toThrow('Not found');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve chamar callback onRetry', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('deve aplicar backoff exponencial', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const delays: number[] = [];
      const startTime = Date.now();

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 50,
        backoffMultiplier: 2,
        onRetry: () => {
          delays.push(Date.now() - startTime);
        }
      });

      expect(fn).toHaveBeenCalledTimes(3);
      // Verificar que os delays aumentam (tolerância de 20ms)
      expect(delays[1] - delays[0]).toBeGreaterThanOrEqual(30);
    });
  });

  describe('classifyHttpError', () => {
    it('deve classificar 429 como temporário', () => {
      const error = classifyHttpError(429, 'Rate limit exceeded');
      expect(error.type).toBe(ErrorType.TEMPORARY);
    });

    it('deve classificar 500 como temporário', () => {
      const error = classifyHttpError(500, 'Internal server error');
      expect(error.type).toBe(ErrorType.TEMPORARY);
    });

    it('deve classificar 503 como temporário', () => {
      const error = classifyHttpError(503, 'Service unavailable');
      expect(error.type).toBe(ErrorType.TEMPORARY);
    });

    it('deve classificar 401 como temporário', () => {
      const error = classifyHttpError(401, 'Unauthorized');
      expect(error.type).toBe(ErrorType.TEMPORARY);
    });

    it('deve classificar 404 como permanente', () => {
      const error = classifyHttpError(404, 'Not found');
      expect(error.type).toBe(ErrorType.PERMANENT);
    });

    it('deve classificar 400 como permanente', () => {
      const error = classifyHttpError(400, 'Bad request');
      expect(error.type).toBe(ErrorType.PERMANENT);
    });

    it('deve classificar 422 como permanente', () => {
      const error = classifyHttpError(422, 'Unprocessable entity');
      expect(error.type).toBe(ErrorType.PERMANENT);
    });
  });

  describe('classifyNetworkError', () => {
    it('deve classificar erro de rede como temporário', () => {
      const originalError = new Error('Network timeout');
      const classified = classifyNetworkError(originalError);

      expect(classified.type).toBe(ErrorType.TEMPORARY);
      expect(classified.message).toContain('Network timeout');
      expect(classified.originalError).toBe(originalError);
    });
  });

  describe('ClassifiedError', () => {
    it('deve criar erro com tipo e mensagem', () => {
      const error = new ClassifiedError('Test error', ErrorType.PERMANENT);

      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.PERMANENT);
      expect(error.name).toBe('ClassifiedError');
    });

    it('deve manter referência ao erro original', () => {
      const originalError = new Error('Original');
      const classified = new ClassifiedError('Wrapped', ErrorType.TEMPORARY, originalError);

      expect(classified.originalError).toBe(originalError);
    });
  });
});
