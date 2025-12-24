/**
 * Validação de Variáveis de Ambiente
 *
 * Este arquivo garante que todas as variáveis de ambiente necessárias estejam configuradas
 * antes da aplicação iniciar. Se alguma variável obrigatória estiver faltando, a aplicação
 * falhará imediatamente com uma mensagem clara.
 */

// Lista de variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'MAIL_HOST',
  'MAIL_PORT',
  'MAIL_USER',
  'MAIL_PASS',
  'CORREIOS_API_KEY',
  'CORREIOS_USERNAME',
  'CORREIOS_POSTAL_CARD'
] as const;

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas
 * @throws {Error} Se alguma variável obrigatória estiver faltando
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Variáveis de ambiente obrigatórias não encontradas:\n` +
      missing.map(v => `   - ${v}`).join('\n') +
      `\n\nCrie um arquivo .env na raiz do projeto com todas as variáveis necessárias.`
    );
  }

  console.log('✓ Todas as variáveis de ambiente obrigatórias estão configuradas');
}

/**
 * Obtém uma variável de ambiente de forma segura
 * @param key - Nome da variável de ambiente
 * @returns Valor da variável
 * @throws {Error} Se a variável não estiver definida
 */
export function getEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Variável de ambiente ${key} não está definida`);
  }

  return value;
}

/**
 * Obtém uma variável de ambiente opcional
 * @param key - Nome da variável de ambiente
 * @param defaultValue - Valor padrão se a variável não estiver definida
 * @returns Valor da variável ou valor padrão
 */
export function getEnvOptional(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}
