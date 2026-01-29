const fs = require('fs');
const path = require('path');

// Import logger import pattern
const addLoggerImport = (content, filePath) => {
  // Only add import if doesn't exist and file is in src/
  if (!filePath.includes('/src/')) return content;
  if (content.includes('import { logger }')) return content;

  // Find the last existing import
  const imports = content.match(/^import .+$/gm);
  if (!imports || imports.length === 0) return content;

  const lastImport = imports[imports.length - 1];
  const importEnd = content.indexOf(lastImport) + lastImport.length;

  // Add logger import after last import
  return content.slice(0, importEnd) + "\nimport { logger } from '@common/monitoring';" + content.slice(importEnd);
};

// Process each file
const processFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  // Add logger import if needed
  modified = addLoggerImport(modified, filePath);

  // Replace console.log with logger.info
  modified = modified.replace(/console\.log\((`[^`]*`)?.*\)/g, (match, template) => {
    if (template) {
      // Extract the message from template literal
      const message = template.slice(1, -1); // Remove backticks
      return `logger.info(\`${message.replace(/\[([^\]]+)\]/g, '$1')}\`)`;
    }
    return 'logger.info("Log message")';
  });

  // Replace console.error with logger.error
  modified = modified.replace(/console\.error\((`[^`]*`)?.*\)/g, (match, template) => {
    if (template) {
      const message = template.slice(1, -1);
      return `logger.error(\`${message.replace(/\[([^\]]+)\]/g, '$1')}\`)`;
    }
    return 'logger.error("Error message")';
  });

  // Replace console.warn with logger.warn
  modified = modified.replace(/console\.warn\((`[^`]*`)?.*\)/g, (match, template) => {
    if (template) {
      const message = template.slice(1, -1);
      return `logger.warn(\`${message.replace(/\[([^\]]+)\]/g, '$1')}\`)`;
    }
    return 'logger.warn("Warning message")';
  });

  if (modified !== content) {
    fs.writeFileSync(filePath, modified);
    console.log(`Updated: ${filePath}`);
  }
};

// Find and process all TypeScript files
const { execSync } = require('child_process');
const files = execSync('find /workspaces/AionUi/src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' }).split('\n').filter(Boolean);

files.forEach(processFile);
console.log(`Processed ${files.length} files`);
