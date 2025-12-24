/**
 * VALUE OBJECT - CPF DO CLIENTE
 *
 * Representa um CPF (Cadastro de Pessoa Física) brasileiro seguindo o padrão DDD.
 * Encapsula as regras de validação e formatação de CPF, garantindo que apenas
 * CPFs válidos sejam criados no sistema.
 *
 * Formato: 11 dígitos numéricos (armazenado sem formatação)
 * Exemplo armazenado: "12345678901"
 * Exemplo formatado: "123.456.789-01"
 *
 * Responsabilidades:
 * - Validar CPF usando algoritmo dos dígitos verificadores
 * - Rejeitar CPFs com todos os dígitos iguais (ex: 111.111.111-11)
 * - Fornecer formatação com máscara
 * - Garantir imutabilidade do valor
 *
 * Padrões aplicados:
 * - Value Object Pattern (DDD)
 * - Factory Method (método estático create)
 * - Immutability (constructor privado, campos readonly)
 */

export class CustomerCPF {
  /**
   * Construtor privado para garantir imutabilidade
   * Apenas acessível através do método factory create()
   */
  private constructor(private readonly _value: string) {}

  /**
   * Factory Method para criar um CPF validado
   *
   * @param value - String contendo o CPF (com ou sem formatação)
   * @returns Nova instância de CustomerCPF
   * @throws Error se o CPF for inválido
   */
  static create(value: string): CustomerCPF {
    if (!CustomerCPF.isValid(value)) {
      throw new Error('CPF inválido');
    }
    return new CustomerCPF(CustomerCPF.clean(value));
  }

  /**
   * Getter para acessar o valor do CPF (apenas dígitos)
   *
   * @returns String com 11 dígitos do CPF
   */
  get value(): string {
    return this._value;
  }

  /**
   * Remove caracteres não numéricos do CPF
   *
   * @param cpf - CPF com ou sem formatação
   * @returns CPF contendo apenas dígitos
   */
  static clean(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  /**
   * Valida um CPF usando o algoritmo oficial dos dígitos verificadores
   *
   * Regras de validação:
   * 1. Deve conter exatamente 11 dígitos
   * 2. Não pode ter todos os dígitos iguais (ex: 111.111.111-11)
   * 3. Os dois últimos dígitos devem ser verificadores válidos
   *
   * Algoritmo dos dígitos verificadores:
   * - Primeiro dígito: soma dos 9 primeiros dígitos multiplicados por (10 a 2)
   * - Segundo dígito: soma dos 10 primeiros dígitos multiplicados por (11 a 2)
   * - Resto da divisão por 11: se < 2, dígito é 0, senão é (11 - resto)
   *
   * @param value - CPF a ser validado (com ou sem formatação)
   * @returns true se o CPF é válido, false caso contrário
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const cleanCpf = CustomerCPF.clean(value);

    // Deve ter exatamente 11 dígitos
    if (cleanCpf.length !== 11) {
      return false;
    }

    // Não pode ter todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    // Validação dos dígitos verificadores
    const digits = cleanCpf.split('').map(Number);

    // Primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    let remainder = sum % 11;
    const firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;

    if (digits[9] !== firstCheckDigit) {
      return false;
    }

    // Segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i);
    }
    remainder = sum % 11;
    const secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;

    return digits[10] === secondCheckDigit;
  }

  /**
   * Compara dois CPFs
   *
   * Value Objects devem ser comparados por valor, não por referência.
   *
   * @param other - Outro CustomerCPF para comparação
   * @returns true se os CPFs são iguais
   */
  equals(other: CustomerCPF): boolean {
    return this._value === other._value;
  }

  /**
   * Converte o CPF para string (apenas dígitos)
   *
   * @returns String com 11 dígitos do CPF
   */
  toString(): string {
    return this._value;
  }

  /**
   * Retorna o CPF formatado com máscara
   *
   * Formato: 123.456.789-01
   *
   * @returns CPF formatado com pontos e traço
   */
  toMasked(): string {
    const cpf = this._value;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  }
}