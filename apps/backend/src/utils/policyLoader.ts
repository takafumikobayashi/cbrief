import * as fs from 'fs/promises';
import * as path from 'path';

const defaultPoliciesDir = path.join(process.cwd(), 'policies');

/**
 * Reads policy files from the /policies directory.
 * @param policyFiles - Array of policy file names to load
 * @param policiesDir - Optional custom policies directory (primarily for testing)
 */
export async function loadPolicies(
  policyFiles: string[],
  policiesDir: string = defaultPoliciesDir
): Promise<string> {
  if (!policyFiles || policyFiles.length === 0) {
    return '';
  }

  const policyContents = await Promise.all(
    policyFiles.map(async (file) => {
      try {
        // Basic security check to prevent path traversal
        if (file.includes('..') || path.isAbsolute(file)) {
          console.warn(`Skipping invalid policy file path: ${file}`);
          return '';
        }
        const filePath = path.join(policiesDir, file);
        return await fs.readFile(filePath, 'utf-8');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        console.warn(`Policy file not found or could not be read: ${file}`);
        return ''; // Return empty string if a file is not found
      }
    })
  );

  return policyContents.filter(Boolean).join('\n\n---\n\n');
}
