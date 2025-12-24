import { TrackingCode } from '../TrackingCode';

describe('TrackingCode', () => {
  describe('create', () => {
    it('should create a valid tracking code', () => {
      const validCode = 'AA123456789BB';
      const trackingCode = TrackingCode.create(validCode);
      
      expect(trackingCode.value).toBe(validCode);
    });

    it('should throw error for invalid tracking code format', () => {
      const invalidCodes = [
        '12345', // too short
        'AA1234567890BB', // too long
        'A1234567890BB', // missing first letter
        'AA12345678B', // missing second letter
        'AA12345678900', // missing letters at end
        'AA123456789B0', // number instead of letter
        '11123456789BB', // numbers instead of letters at start
      ];

      invalidCodes.forEach(code => {
        expect(() => TrackingCode.create(code)).toThrow('Código de rastreamento inválido');
      });
    });

    it('should handle case insensitive input', () => {
      const lowerCaseCode = 'aa123456789bb';
      const trackingCode = TrackingCode.create(lowerCaseCode);
      
      expect(trackingCode.value).toBe(lowerCaseCode);
    });
  });

  describe('isValid', () => {
    it('should return true for valid codes', () => {
      const validCodes = [
        'AA123456789BB',
        'XY987654321ZW',
        'QQ111111111QQ'
      ];

      validCodes.forEach(code => {
        expect(TrackingCode.isValid(code)).toBe(true);
      });
    });

    it('should return false for invalid codes', () => {
      const invalidCodes = [
        '',
        null as any,
        undefined as any,
        'invalid',
        '123456789',
        'AA123456789B'
      ];

      invalidCodes.forEach(code => {
        expect(TrackingCode.isValid(code)).toBe(false);
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal tracking codes', () => {
      const code1 = TrackingCode.create('AA123456789BB');
      const code2 = TrackingCode.create('AA123456789BB');
      
      expect(code1.equals(code2)).toBe(true);
    });

    it('should return false for different tracking codes', () => {
      const code1 = TrackingCode.create('AA123456789BB');
      const code2 = TrackingCode.create('CC987654321DD');
      
      expect(code1.equals(code2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the tracking code value as string', () => {
      const code = 'AA123456789BB';
      const trackingCode = TrackingCode.create(code);
      
      expect(trackingCode.toString()).toBe(code);
    });
  });
});