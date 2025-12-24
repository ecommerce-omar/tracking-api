import { CustomerCPF } from '../CustomerCPF';

describe('CustomerCPF', () => {
  describe('create', () => {
    it('should create a valid CPF', () => {
      const validCPF = '11144477735'; // Valid CPF
      const cpf = CustomerCPF.create(validCPF);
      
      expect(cpf.value).toBe(validCPF);
    });

    it('should create CPF removing formatting', () => {
      const formattedCPF = '111.444.777-35';
      const expectedCPF = '11144477735';
      const cpf = CustomerCPF.create(formattedCPF);
      
      expect(cpf.value).toBe(expectedCPF);
    });

    it('should throw error for invalid CPF', () => {
      const invalidCPFs = [
        '12345678901', // Invalid check digits
        '11111111111', // All same digits
        '123456789', // Too short
        'invalid', // Not numbers
        '', // Empty
      ];

      invalidCPFs.forEach(cpf => {
        expect(() => CustomerCPF.create(cpf)).toThrow('CPF inválido');
      });
    });
  });

  describe('isValid', () => {
    it('should return true for valid CPFs', () => {
      const validCPFs = [
        '11144477735',
        '111.444.777-35',
        '12345678909' // Another valid CPF
      ];

      validCPFs.forEach(cpf => {
        expect(CustomerCPF.isValid(cpf)).toBe(true);
      });
    });

    it('should return false for invalid CPFs', () => {
      const invalidCPFs = [
        '12345678901', // Invalid check digits
        '11111111111', // All same digits
        '00000000000', // All zeros
        '123456789', // Too short
        '123456789012', // Too long
        'invalid', // Not numbers
        '', // Empty
        null as any,
        undefined as any
      ];

      invalidCPFs.forEach(cpf => {
        expect(CustomerCPF.isValid(cpf)).toBe(false);
      });
    });
  });

  describe('clean', () => {
    it('should remove all non-digit characters', () => {
      expect(CustomerCPF.clean('111.444.777-35')).toBe('11144477735');
      expect(CustomerCPF.clean('111 444 777 35')).toBe('11144477735');
      expect(CustomerCPF.clean('111abc444def777ghi35')).toBe('11144477735');
    });
  });

  describe('equals', () => {
    it('should return true for equal CPFs', () => {
      const cpf1 = CustomerCPF.create('11144477735');
      const cpf2 = CustomerCPF.create('111.444.777-35');
      
      expect(cpf1.equals(cpf2)).toBe(true);
    });

    it('should return false for different CPFs', () => {
      const cpf1 = CustomerCPF.create('11144477735');
      const cpf2 = CustomerCPF.create('12345678909');
      
      expect(cpf1.equals(cpf2)).toBe(false);
    });
  });

  describe('toMasked', () => {
    it('should return formatted CPF', () => {
      const cpf = CustomerCPF.create('11144477735');
      
      expect(cpf.toMasked()).toBe('111.444.777-35');
    });
  });

  describe('toString', () => {
    it('should return clean CPF', () => {
      const cpf = CustomerCPF.create('111.444.777-35');
      
      expect(cpf.toString()).toBe('11144477735');
    });
  });
});