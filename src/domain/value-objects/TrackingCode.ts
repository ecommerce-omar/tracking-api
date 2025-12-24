/**
 * VALUE OBJECT - CÓDIGO DE RASTREAMENTO
 *
 * Representa um código de rastreamento dos Correios seguindo o padrão DDD.
 * Um Value Object é um objeto imutável que é definido por seus atributos,
 * não por uma identidade.
 *
 * Formato esperado: 2 letras + 9 dígitos + 2 letras (ex: AA123456789BR)
 *
 * Responsabilidades:
 * - Validar formato do código de rastreamento
 * - Garantir imutabilidade do valor
 * - Fornecer métodos de comparação e conversão
 *
 * Padrões aplicados:
 * - Value Object Pattern (DDD)
 * - Factory Method (método estático create)
 * - Immutability (constructor privado, campos readonly)
 */

export class TrackingCode {
  /**
   * Construtor privado para garantir imutabilidade
   * Apenas acessível através do método factory create()
   */
  private constructor(private readonly _value: string) {}

  /**
   * Factory Method para criar um TrackingCode validado
   *
   * @param value - String contendo o código de rastreamento
   * @returns Nova instância de TrackingCode
   * @throws Error se o código for inválido
   */
  static create(value: string): TrackingCode {
    if (!TrackingCode.isValid(value)) {
      throw new Error('Código de rastreamento inválido. Deve ter exatamente 13 caracteres.');
    }
    return new TrackingCode(value);
  }

  /**
   * Getter para acessar o valor do código
   *
   * @returns String com o código de rastreamento
   */
  get value(): string {
    return this._value;
  }

  /**
   * Valida o formato do código de rastreamento
   *
   * Formato dos Correios: 13 caracteres (2 letras + 9 dígitos + 2 letras)
   * Exemplo: AA123456789BR
   *
   * @param value - String a ser validada
   * @returns true se o código é válido, false caso contrário
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Formato dos Correios: 13 caracteres (2 letras + 9 dígitos + 2 letras)
    const trackingRegex = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
    return trackingRegex.test(value.toUpperCase());
  }

  /**
   * Compara dois códigos de rastreamento
   *
   * Value Objects devem ser comparados por valor, não por referência.
   *
   * @param other - Outro TrackingCode para comparação
   * @returns true se os códigos são iguais
   */
  equals(other: TrackingCode): boolean {
    return this._value === other._value;
  }

  /**
   * Converte o código para string
   *
   * @returns String com o código de rastreamento
   */
  toString(): string {
    return this._value;
  }
}