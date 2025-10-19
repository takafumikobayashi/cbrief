import { detectLanguage } from '../languageDetector';

describe('detectLanguage', () => {
  it('should correctly identify JavaScript code', () => {
    const code = `
      function hello() {
        console.log('Hello, World!');
      }
    `;
    expect(detectLanguage(code)).toBe('javascript');
  });

  it('should correctly identify TypeScript code', () => {
    const code = `
      interface User {
        name: string;
        id: number;
      }
    `;
    expect(detectLanguage(code)).toBe('typescript');
  });

  it('should correctly identify Python code', () => {
    const code = `
      def hello():
        print('Hello, World!')
    `;
    expect(detectLanguage(code)).toBe('python');
  });

  it('should handle empty string', () => {
    const code = '';
    expect(detectLanguage(code)).toBe('javascript'); // Default to JavaScript
  });

  it('should handle code with mixed keywords', () => {
    const code = `
      # This is a Python comment
      def my_function():
        # But it has some JS-like syntax
        if (true) {
          print('hello')
        }
    `;
    expect(detectLanguage(code)).toBe('python');
  });
});
