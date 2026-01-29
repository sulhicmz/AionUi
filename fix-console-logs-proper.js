const fs = require('fs');
const path = require('path');

const needsLoggerImport = (content) => {
  return content.includes('console.log') || content.includes('console.error') || content.includes('console.warn');
};

const isTypeDefinitionFile = (filePath) => {
  return filePath.includes('types.ts') || filePath.includes('.d.ts');
};

const hasLoggerImport = (content) => {
  return content.includes('import.*logger') || content.includes('import * as logger');
};

const addLoggerImport = (content, filePath) => {
  if (!needsLoggerImport(content) || isTypeDefinitionFile(filePath) || hasLoggerImport(content)) {
    return content;
  }
  
  // Determine proper import path
  const relativePath = path.relative(path.dirname(filePath), '/workspaces/AionUi/src/common/monitoring');
  const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
  
  // Find the last existing import
  const imports = content.match(/^import.*$/gm);
  if (!imports || imports.length === 0) return content;
  
  // Find position after last import
  let lastImportLine = 0;
  for (let i = 0; i < content.split('\n').length; i++) {
    if (content.split('\n')[i].startsWith('import')) {
      lastImportLine = i;
    } else if (lastImportLine > 0 && content.split('\n')[i].trim() === '') {
      // Stop at first empty line after imports
      break;
    }
  }
  
  const lines = content.split('\n');
  lines.splice(lastImportLine + 1, 0, `import { logger } from '${importPath}';`);
  
  return lines.join('\n');
};

const replaceConsoleStatements = (content) => {
  // Replace console.log with logger.info
  content = content.replace(/console\.log\(([^)]+)\)/g, (match, args) => {
    return `logger.info(${args})`;
  });
  
  // Replace console.error with logger.error  
  content = content.replace(/console\.error\(([^)]+)\)/g, (match, args) => {
    return `logger.error(${args})`;
  });
  
  // Replace console.warn with logger.warn
  content = content.replace(/console\.warn\(([^)]+)\)/g, (match, args) => {
    return `logger.warn(${args})`;
  });
  
  return content;
};

const processFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  
  // Replace console statements
  modified = replaceConsoleStatements(modified);
  
  // Add logger import if needed
  modified = addLoggerImport(modified, filePath);
  
  // Clean up any duplicate logger imports
  modified = modified.replace(/(import\s*{[^}]*logger[^}]*}[^;]*;[\r\n\s]*)+/g, '$1');
  
  if (modified !== content) {
    fs.writeFileSync(filePath, modified);
    console.log(`Updated: ${filePath}`);
  }
};

// Restore files that shouldn't have console statements
const typeFiles = [
  '/workspaces/AionUi/src/process/database/types.ts'
];
typeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    require('child_process').execSync(`git checkout -- ${file}`);
  }
});

// Process files
const { execSync } = require('child_process');
const files = execSync('find /workspaces/AionUi/src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

files.forEach(processFile);
console.log(`Processed ${files.length} files`);
