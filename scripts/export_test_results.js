const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const resultsDir = path.join(projectRoot, 'test-results');
const jsonPath = path.join(resultsDir, 'jest_results.json');
const csvPath = path.join(resultsDir, 'jest_results.csv');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

console.log('Running tests (CI mode) and writing Jest JSON to:', jsonPath);

// Run npm test with args forwarded to jest to produce JSON output.
// On Windows wrap with cmd /c to avoid spawn issues on paths with non-ascii characters.
let res;
if (process.platform === 'win32') {
  const cmd = 'cmd';
  const args = ['/c', 'npm', 'test', '--', '--json', `--outputFile=${jsonPath}`, '--watchAll=false'];
  res = spawnSync(cmd, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: Object.assign({}, process.env, { CI: 'true' })
  });
} else {
  const npmCmd = 'npm';
  res = spawnSync(npmCmd, ['test', '--', '--json', `--outputFile=${jsonPath}`, '--watchAll=false'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: Object.assign({}, process.env, { CI: 'true' })
  });
}

if (res.error) {
  console.error('Failed to run tests:', res.error);
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) {
  console.error('Jest JSON result not found at', jsonPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Build CSV rows: testFile, describe, testName, status, failureMessage
const rows = [];
rows.push(['testFile', 'describe', 'testName', 'status', 'failureMessage'].join(','));

if (Array.isArray(data.testResults)) {
  data.testResults.forEach(suite => {
    const testFile = path.relative(projectRoot, suite.testFilePath || '');
    if (Array.isArray(suite.assertionResults)) {
      suite.assertionResults.forEach(assertion => {
        const describe = (assertion.ancestorTitles || []).join(' > ');
        const testName = assertion.title.replace(/\n/g, ' ');
        const status = assertion.status || '';
        const failureMessage = (assertion.failureMessages || []).join(' | ').replace(/\r?\n/g, ' ');
        // Escape double quotes and wrap fields containing commas in quotes
        const esc = (s) => (typeof s === 'string' && s.indexOf(',') !== -1) ? `"${s.replace(/"/g, '""')}"` : s;
        rows.push([esc(testFile), esc(describe), esc(testName), esc(status), esc(failureMessage)].join(','));
      });
    }
  });
}

fs.writeFileSync(csvPath, rows.join('\n'), 'utf8');
console.log('Wrote CSV results to', csvPath);

// Also print a short summary
console.log(`Summary: total=${data.numTotalTests || 0}, passed=${data.numPassedTests || 0}, failed=${data.numFailedTests || 0}, skipped=${data.numPendingTests || 0}`);

if (data.numFailedTests && data.numFailedTests > 0) process.exit(2);
process.exit(0);
