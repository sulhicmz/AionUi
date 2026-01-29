const fs = require('fs');

const fixLineLength = (content) => {
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    if (line.length > 120) {
      // Check for common patterns to safely split
      if (line.includes('import') && line.includes('from')) {
        // Don't break import statements
        return line;
      }
      
      if (line.includes('.info(') || line.includes('.error(') || line.includes('.warn(') || line.includes('.debug(')) {
        // Split logger statements
        const match = line.match(/^(.+)(\.(?:info|error|warn|debug)\()(.+)(\))$/);
        if (match) {
          const [, prefix, methodStart, args, methodEnd] = match;
          return `${prefix}${methodStart}\n    ${args}${methodEnd}`;
        }
      }
      
      if (line.includes('return {')) {
        // Split object return
        const indent = line.match(/^(\s*)/)[1];
        const after = line.substring(line.indexOf('{') + 1);
        return `${line.substring(0, line.indexOf('{') + 1)}\n${indent}  ${after.trim()}`;
      }
      
      if (line.includes(' && ')) {
        // Split logical AND
        const parts = line.split(' && ');
        const indent = line.match(/^(\s*)/)[1];
        if (parts.length === 2 && parts[1].length > 60) {
          return `${parts[0]} &&\n${indent}  ${parts[1].trim()}`;
        }
      }
      
      if (line.includes(' || ')) {
        // Split logical OR
        const parts = line.split(' || ');
        const indent = line.match(/^(\s*)/)[1];
        if (parts.length === 2 && parts[1].length > 60) {
          return `${parts[0]} ||\n${indent}  ${parts[1].trim()}`;
        }
      }
      
      // For other long lines, try to split at commas, semicolons, or operators
      const splitPoints = [', ', '; ', '? ', ' : '];
      for (const point of splitPoints) {
        if (line.includes(point)) {
          const parts = line.split(point);
          if (parts.length > 1) {
            const indent = line.match(/^(\s*)/)[1];
            const lastPart = parts.pop();
            return `${parts.join(point)}${point}\n${indent}  ${lastPart.trim()}`;
          }
        }
      }
      
      // If no good split point, leave as is
      return line;
    }
    return line;
  });
  
  return fixedLines.join('\n');
};

// Process files with line length issues
const { execSync } = require('child_process');
const files = execSync('npx eslint --ext .ts,.tsx src --format json 2>/dev/null', { encoding: 'utf8' });
const eslintResults = JSON.parse(files);

if (eslintResults && eslintResults.length > 0) {
  eslintResults.forEach(result => {
    if (result.messages) {
      const maxLenWarnings = result.messages.filter(m => m.ruleId === 'max-len');
      if (maxLenWarnings.length > 0) {
        const filePath = result.filePath;
        console.log(`\nFixing line length in: ${filePath}`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        content = fixLineLength(content);
        fs.writeFileSync(filePath, content);
      }
    }
  });
}
