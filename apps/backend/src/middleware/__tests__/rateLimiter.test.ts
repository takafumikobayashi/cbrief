import { parsePositiveInt } from '../rateLimiter';

describe('parsePositiveInt', () => {
  // Suppress console.warn for cleaner test output
  const originalWarn = console.warn;
  beforeAll(() => {
    console.warn = jest.fn();
  });
  afterAll(() => {
    console.warn = originalWarn;
  });

  describe('valid inputs', () => {
    it('should parse valid positive integer', () => {
      expect(parsePositiveInt('10', 5, 'TEST')).toBe(10);
    });

    it('should parse string with whitespace', () => {
      expect(parsePositiveInt('  20  ', 5, 'TEST')).toBe(20);
    });

    it('should floor decimal numbers', () => {
      expect(parsePositiveInt('10.7', 5, 'TEST')).toBe(10);
      expect(parsePositiveInt('10.2', 5, 'TEST')).toBe(10);
    });

    it('should return default for undefined', () => {
      expect(parsePositiveInt(undefined, 5, 'TEST')).toBe(5);
    });
  });

  describe('invalid inputs', () => {
    it('should return default for non-numeric string', () => {
      expect(parsePositiveInt('abc', 5, 'TEST')).toBe(5);
      expect(console.warn).toHaveBeenCalledWith('⚠️  Invalid TEST="abc", using default: 5');
    });

    it('should return default for zero', () => {
      expect(parsePositiveInt('0', 5, 'TEST')).toBe(5);
      expect(console.warn).toHaveBeenCalledWith('⚠️  Invalid TEST="0", using default: 5');
    });

    it('should return default for negative numbers', () => {
      expect(parsePositiveInt('-10', 5, 'TEST')).toBe(5);
      expect(console.warn).toHaveBeenCalledWith('⚠️  Invalid TEST="-10", using default: 5');
    });

    it('should return default for empty string', () => {
      expect(parsePositiveInt('', 5, 'TEST')).toBe(5);
      expect(console.warn).toHaveBeenCalledWith('⚠️  Invalid TEST="", using default: 5');
    });

    it('should return default for string with units', () => {
      expect(parsePositiveInt('10/min', 5, 'TEST')).toBe(5);
      expect(console.warn).toHaveBeenCalledWith('⚠️  Invalid TEST="10/min", using default: 5');
    });

    it('should return default for NaN', () => {
      expect(parsePositiveInt('not-a-number', 5, 'TEST')).toBe(5);
    });

    it('should return default for Infinity', () => {
      expect(parsePositiveInt('Infinity', 5, 'TEST')).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      expect(parsePositiveInt('999999999', 5, 'TEST')).toBe(999999999);
    });

    it('should handle numbers close to zero', () => {
      expect(parsePositiveInt('0.001', 5, 'TEST')).toBe(0); // Floor to 0, which is <= 0, so returns default
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle number 1', () => {
      expect(parsePositiveInt('1', 5, 'TEST')).toBe(1);
    });
  });
});
