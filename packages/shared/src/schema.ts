/**
 * JSONスキーマ定義（PRD §9に基づく）
 */
export const analysisSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['summary', 'risks'],
  properties: {
    summary: {
      type: 'object',
      required: ['purpose', 'io', 'data_sensitivity'],
      properties: {
        purpose: { type: 'string', maxLength: 1000 },
        io: {
          type: 'object',
          properties: {
            inputs: { type: 'array', items: { type: 'string' } },
            outputs: { type: 'array', items: { type: 'string' } },
          },
        },
        data_sensitivity: {
          type: 'array',
          items: { enum: ['None', 'PII', 'Credentials', 'Payment', 'Health', 'Other'] },
        },
        side_effects: { type: 'array', items: { type: 'string' } },
        ops_requirements: { type: 'array', items: { type: 'string' } },
        scope_limits: { type: 'array', items: { type: 'string' } },
      },
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['risk', 'severity', 'evidence', 'fix', 'priority'],
        properties: {
          risk: { type: 'string' },
          severity: { enum: ['High', 'Medium', 'Low'] },
          evidence: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'integer' },
              excerpt: { type: 'string' },
            },
          },
          fix: { type: 'string' },
          effort: { enum: ['S', 'M', 'L'] },
          priority: { type: 'integer', minimum: 1 },
        },
      },
    },
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          diff: { type: 'string' },
          explanation: { type: 'string' },
        },
      },
    },
    next_actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          owner: { type: 'string' },
          priority: { type: 'integer' },
          effort: { enum: ['S', 'M', 'L'] },
          duedate: { type: 'string' },
        },
      },
    },
    artifacts: {
      type: 'object',
      properties: {
        markdown: { type: 'string' },
      },
    },
  },
} as const;
