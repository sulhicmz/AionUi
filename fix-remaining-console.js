const fs = require('fs');
const path = require('path');

const files = [
  '/workspaces/AionUi/src/process/bridge/authBridge.ts',
  '/workspaces/AionUi/src/agent/gemini/utils.ts',
  '/workspaces/AionUi/src/agent/gemini/cli/config.ts',
  '/workspaces/AionUi/src/common/logging/Logger.ts'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the file if it's only console.debug or similar
    if (filePath.includes('authBridge.ts')) {
      // Keep as this is low-level debug logging
    } else if (filePath.includes('Logger.ts')) {
      // This one actually needs console as底层output
    } else if (filePath.includes('config.ts')) {
      // Replace inline function in config object
      content = content.replace(
        /debug: \([^)]*\) => console\.debug/,
        "debug: (...args) => logger.debug('DEBUG', ...args)"
      );
      
      // Add import if needed
      if (!content.includes('import { logger }')) {
        const lastImport = content.lastIndexOf('import');
        const lineBreakAfter = content.indexOf('\n', lastImport) + 1;
        content = content.slice(0, lineBreakAfter) + 
                  'import { logger } from \'@common/monitoring\';\n' + 
                  content.slice(lineBreakAfter);
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed console in: ${filePath}`);
    }
  }
});
