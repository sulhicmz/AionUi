const fs = require('fs');
const content = fs.readFileSync('src/process/database/index.ts', 'utf8');

// Replace all catch blocks with proper error handling
const pattern = /} catch \(error: any\) {\s*return {\s*success: false,\s*error: error\.message,\s*(?:,\s*data: null,\s*)?};\s*}/g;
const replacement = '} catch (error: unknown) {\n      return this.handleError(error);\n    }';

const result = content.replace(pattern, replacement);
fs.writeFileSync('src/process/database/index.ts', result);
console.log('Database error handling updated');
