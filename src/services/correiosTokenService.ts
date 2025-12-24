/**
 * Dados do token de autenticação dos Correios
 */
interface TokenData {
  token: string;
  expiresAt: Date;
}

/**
 * Serviço de gerenciamento de tokens da API dos Correios
 *
 * Responsável por:
 * - Gerar tokens de autenticação
 * - Manter cache de tokens válidos
 * - Evitar race conditions em requisições simultâneas
 */
class CorreiosTokenService {
  private tokenCache: TokenData | null = null;
  private tokenPromise: Promise<string> | null = null; // Previne race conditions

  /**
   * Obtém um token válido (do cache ou gerando um novo)
   * Thread-safe: Múltiplas chamadas simultâneas compartilharão a mesma Promise
   */
  async getValidToken(): Promise<string> {
    // Se temos um token válido em cache, retorna imediatamente
    if (this.tokenCache && this.tokenCache.expiresAt > new Date()) {
      return this.tokenCache.token;
    }

    // Se já existe uma geração de token em andamento, aguarda a mesma Promise
    // Isso evita múltiplas chamadas simultâneas à API dos Correios
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Inicia nova geração de token
    this.tokenPromise = this.generateNewToken()
      .finally(() => {
        // Limpa a Promise após conclusão (sucesso ou erro)
        this.tokenPromise = null;
      });

    return this.tokenPromise;
  }

  /**
   * Gera um novo token de autenticação na API dos Correios
   * @private
   */
  private async generateNewToken(): Promise<string> {
    const apiKey = process.env.CORREIOS_API_KEY;
    const username = process.env.CORREIOS_USERNAME;
    const postalCard = process.env.CORREIOS_POSTAL_CARD;

    try {
      // Valida se as credenciais estão configuradas
      if (!apiKey || !username || !postalCard) {
        throw new Error('Credenciais dos Correios não configuradas. Verifique CORREIOS_API_KEY, CORREIOS_USERNAME e CORREIOS_POSTAL_CARD');
      }

      // Monta Basic Auth conforme documentação dos Correios
      const basicAuth = Buffer.from(`${username}:${apiKey}`).toString('base64');

      const response = await fetch('https://api.correios.com.br/token/v1/autentica/cartaopostagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          numero: postalCard
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao gerar token dos Correios:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Erro ao gerar token: ${response.status} - ${response.statusText}. Detalhes: ${errorText}`);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('Token não retornado pela API dos Correios');
      }

      // Armazena token em cache com expiração de 1 hora
      // NOTA: Ajuste o tempo se os Correios mudarem a política de expiração
      const TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hora
      this.tokenCache = {
        token: data.token,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRATION_MS)
      };

      console.log('✓ Novo token dos Correios gerado com sucesso');
      return data.token;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('❌ Erro detalhado ao gerar token dos Correios:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
        stack: errorStack,
        credentials: {
          hasApiKey: !!apiKey,
          hasUsername: !!username,
          hasPostalCard: !!postalCard
        }
      });
      throw error;
    }
  }

  /**
   * Limpa o cache de token
   * Útil para forçar renovação ou em situações de teste
   */
  clearCache(): void {
    this.tokenCache = null;
    this.tokenPromise = null;
  }
}

export const correiosTokenService = new CorreiosTokenService();
