import * as path from 'path';
import type {
  Parser as WebTreeSitterParser,
  Language,
  Node as WebTreeSitterNode,
} from 'web-tree-sitter';

// Correct paths to the .wasm files
const languageWasmPaths = {
  javascript: path.join(
    __dirname,
    '../../node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm'
  ),
  typescript: path.join(
    __dirname,
    '../../node_modules/tree-sitter-typescript/tree-sitter-typescript.wasm'
  ),
  python: path.join(__dirname, '../../node_modules/tree-sitter-python/tree-sitter-python.wasm'),
};

export interface ASTExtractionResult {
  functions: string[];
  classes: string[];
  imports: string[];
  comments: string[];
}

let parser: WebTreeSitterParser | null = null;
const languages: { [key: string]: Language } = {};

/**
 * Initialize the tree-sitter parser and load language grammars.
 */
async function initializeParser(): Promise<void> {
  if (parser) return;

  // Import the web-tree-sitter module
  // Despite the type definitions suggesting a default export, the runtime module
  // actually exports Parser and Language as named exports
  const TreeSitter = await import('web-tree-sitter');
  const Parser = (TreeSitter as { Parser: typeof WebTreeSitterParser & { init(): Promise<void> } })
    .Parser;
  const Language = TreeSitter.Language;

  await Parser.init();
  parser = new Parser();

  for (const lang in languageWasmPaths) {
    const wasmPath = languageWasmPaths[lang as keyof typeof languageWasmPaths];
    languages[lang] = await Language.load(wasmPath);
  }
}

/**
 * Set the language for the parser.
 */
function setLanguage(language: 'javascript' | 'typescript' | 'python'): void {
  if (!parser) throw new Error('Parser not initialized');
  const lang = languages[language];
  if (!lang) {
    throw new Error(`Language not loaded: ${language}`);
  }
  parser.setLanguage(lang);
}

/**
 * Extract information from the AST.
 */
export async function extractFromAST(
  code: string,
  language: 'javascript' | 'typescript' | 'python'
): Promise<ASTExtractionResult> {
  await initializeParser();
  setLanguage(language);

  if (!parser) throw new Error('Parser not initialized');

  const tree = parser.parse(code);
  if (!tree) {
    return { functions: [], classes: [], imports: [], comments: [] };
  }
  const root = tree.rootNode;

  const functions: string[] = [];
  const classes: string[] = [];
  const imports: string[] = [];
  const comments: string[] = [];

  function traverse(node: WebTreeSitterNode) {
    if (!node) return;
    switch (node.type) {
      case 'function_declaration':
      case 'function_expression':
      case 'function_definition': {
        const identifier = node.childForFieldName('name');
        if (identifier) {
          functions.push(identifier.text);
        }
        break;
      }
      case 'class_declaration':
      case 'class_definition': {
        const identifier = node.childForFieldName('name');
        if (identifier) {
          classes.push(identifier.text);
        }
        break;
      }
      case 'import_statement':
      case 'import_from_statement': {
        imports.push(node.text);
        break;
      }
      case 'comment': {
        comments.push(node.text);
        break;
      }
    }

    for (const child of node.children) {
      if (child) {
        traverse(child);
      }
    }
  }

  if (root) {
    traverse(root);
  }

  return {
    functions,
    classes,
    imports,
    comments,
  };
}
