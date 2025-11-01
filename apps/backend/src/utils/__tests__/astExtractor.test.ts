import { extractFromAST } from '../astExtractor';

describe('extractFromAST', () => {
  it('should extract functions, classes, and imports from JavaScript', async () => {
    const code = `
      import fs from 'fs';

      class MyClass {
        constructor() {}
      }

      function myFunction() {}
    `;
    const result = await extractFromAST(code, 'javascript');
    expect(result.functions).toEqual(['myFunction']);
    expect(result.classes).toEqual(['MyClass']);
    expect(result.imports).toEqual(["import fs from 'fs';"]);
  });

  it('should extract functions, classes, and imports from TypeScript', async () => {
    const code = `
      import type { Request, Response } from 'express';

      interface User {
        name: string;
      }

      class MyClass implements User {
        name = 'test';
      }

      function myFunction(req: Request, res: Response) {}
    `;
    const result = await extractFromAST(code, 'typescript');
    expect(result.functions).toEqual(['myFunction']);
    expect(result.classes).toEqual(['MyClass']);
    expect(result.imports).toEqual(["import type { Request, Response } from 'express';"]);
  });

  it('should extract functions, classes, and imports from Python', async () => {
    const code = `
      import os
      from sys import argv

      class MyClass:
        pass

      def my_function():
        pass
    `;
    const result = await extractFromAST(code, 'python');
    expect(result.functions).toEqual(['my_function']);
    expect(result.classes).toEqual(['MyClass']);
    expect(result.imports).toEqual(['import os', 'from sys import argv']);
  });

  it('should handle empty code', async () => {
    const code = '';
    const result = await extractFromAST(code, 'javascript');
    expect(result.functions).toEqual([]);
    expect(result.classes).toEqual([]);
    expect(result.imports).toEqual([]);
  });
});
