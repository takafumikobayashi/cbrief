import { loadPolicies } from '../policyLoader';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('loadPolicies', () => {
  const policiesDir = path.join(process.cwd(), 'policies');

  beforeAll(async () => {
    await fs.mkdir(policiesDir, { recursive: true });
    await fs.writeFile(path.join(policiesDir, 'policy1.md'), 'Policy 1 content');
    await fs.writeFile(path.join(policiesDir, 'policy2.md'), 'Policy 2 content');
  });

  afterAll(async () => {
    await fs.rm(policiesDir, { recursive: true, force: true });
  });

  it('should load a single policy file', async () => {
    const content = await loadPolicies(['policy1.md']);
    expect(content).toBe('Policy 1 content');
  });

  it('should load multiple policy files', async () => {
    const content = await loadPolicies(['policy1.md', 'policy2.md']);
    expect(content).toBe('Policy 1 content\n\n---\n\nPolicy 2 content');
  });

  it('should handle non-existent policy files', async () => {
    const content = await loadPolicies(['non-existent-policy.md']);
    expect(content).toBe('');
  });

  it('should handle empty policy files', async () => {
    await fs.writeFile(path.join(policiesDir, 'empty.md'), '');
    const content = await loadPolicies(['empty.md']);
    expect(content).toBe('');
  });

  it('should prevent path traversal attacks', async () => {
    const content = await loadPolicies(['../outside.md']);
    expect(content).toBe('');
  });
});
