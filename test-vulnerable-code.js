// Test script to verify static analysis detection
const vulnerableCode = `
// Intentionally vulnerable code for testing Semgrep
const userInput = req.query.input;

// Command injection vulnerability
const { exec } = require('child_process');
exec('ls ' + userInput);

// eval usage (dangerous)
eval(userInput);

// Hardcoded secret
const apiKey = "AKIAIOSFODNN7EXAMPLE";

// XSS vulnerability
res.send('<div>' + userInput + '</div>');
`;

async function testAnalysis() {
  const response = await fetch('http://localhost:3001/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: vulnerableCode,
      languageHint: 'javascript',
    }),
  });

  const result = await response.json();
  console.log('Analysis Result:');
  console.log(JSON.stringify(result, null, 2));

  // Count findings
  const totalFindings = (result.securityIssues?.length || 0) +
                       (result.codeSmells?.length || 0);

  console.log(`\nTotal findings detected: ${totalFindings}`);

  if (totalFindings > 0) {
    console.log('✅ Static analysis is working correctly!');
  } else {
    console.log('❌ No issues detected - there may be a problem');
  }
}

testAnalysis().catch(console.error);
