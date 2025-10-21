import { loadPolicies } from '../policyLoader';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('loadPolicies', () => {
  // Use a temporary directory for testing to avoid modifying real policy files
  let testPoliciesDir: string;

  beforeAll(async () => {
    // Create a unique temporary directory for this test suite
    testPoliciesDir = path.join(os.tmpdir(), `policies-test-${Date.now()}`);
    await fs.mkdir(testPoliciesDir, { recursive: true });
    await fs.writeFile(path.join(testPoliciesDir, 'policy1.md'), 'Policy 1 content');
    await fs.writeFile(path.join(testPoliciesDir, 'policy2.md'), 'Policy 2 content');
  });

  afterAll(async () => {
    // Clean up only the temporary test directory
    await fs.rm(testPoliciesDir, { recursive: true, force: true });
  });

  it('should load a single policy file', async () => {
    const content = await loadPolicies(['policy1.md'], testPoliciesDir);
    expect(content).toBe('Policy 1 content');
  });

  it('should load multiple policy files', async () => {
    const content = await loadPolicies(['policy1.md', 'policy2.md'], testPoliciesDir);
    expect(content).toBe('Policy 1 content\n\n---\n\nPolicy 2 content');
  });

  it('should handle non-existent policy files', async () => {
    const content = await loadPolicies(['non-existent-policy.md'], testPoliciesDir);
    expect(content).toBe('');
  });

  it('should handle empty policy files', async () => {
    await fs.writeFile(path.join(testPoliciesDir, 'empty.md'), '');
    const content = await loadPolicies(['empty.md'], testPoliciesDir);
    expect(content).toBe('');
  });

  it('should prevent path traversal attacks', async () => {
    const content = await loadPolicies(['../outside.md'], testPoliciesDir);
    expect(content).toBe('');
  });
});
