# TROUBLESHOOTING.md - Common Issues & Solutions

**Created**: 2025-01-29  
**Purpose**: Troubleshooting guide for common development issues  
**Target Audience**: Developers encountering problems with AionUi  

---

## 🐛 Quick Diagnostics

### Initial Checks

Before diving deep into troubleshooting, run these quick diagnostics:

```bash
# Check Node.js version
node --version  # Should be 18.x or 20.x

# Check npm version
npm --version

# Verify installation
npm ls --depth=0

# Run basic tests
npm test

# Check application logs
npm start 2>&1 | head -50
```

---

## 🚀 Installation & Setup Issues

### 1. Node.js Version Incompatibility

**Problem**: `npm install` fails with version errors

**Solution**:
```bash
# Install compatible Node.js version
nvm install 20
nvm use 20

# Or download from Node.js official site
# https://nodejs.org/en/download/
```

**Prevention**: Add `.nvmrc` file to project:
```
20
```

### 2. Permission Denied Errors

**Problem**: `EACCES: permission denied` during installation

**Solution**:
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Or use npx (recommended)
npx <command>
```

### 3. Build Failures

**Problem**: Build fails with native module errors

**Solution**:
```bash
# Clear node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Rebuild native modules
npm rebuild

# If still fails, try with specific Python version
npm config set python python3
npm install
```

### 4. Electron Builder Issues

**Problem**: `electron-builder` fails during packaging

**Solution**:
```bash
# Update electron-builder
npm install --save-dev electron-builder@latest

# Clear caches
rm -rf out dist

# Try specific platform build
npm run dist:mac    # macOS only
npm run dist:win    # Windows only
npm run dist:linux  # Linux only
```

---

## ⚡ Application Runtime Issues

### 1. Application Won't Start

**Problem**: Application shows white screen or crashes on startup

**Diagnostics**:
```bash
# Check for errors in main process
npm start -- --enable-logging
npm start -- --inspect=5858

# Look for common issues
grep -r "Error" src/main/
grep -r "Error" src/renderer/
```

**Common Solutions**:
```typescript
// Check preload.ts for contextBridge issues
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Expose APIs safely
  });
}

// Check main process error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Graceful shutdown
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
```

### 2. Database Connection Issues

**Problem**: SQLite database errors

**Diagnostics**:
```bash
# Check database file permissions
ls -la ~/.aionui/
ls -la ~/.aionui/database/

# Verify database schema
sqlite3 ~/.aionui/database/chat.db ".schema"
```

**Solutions**:
```typescript
// Database connection with error handling
try {
  const db = new Database(dbPath);
  // Test connection
  db.prepare('SELECT 1').get();
} catch (error) {
  console.error('Database connection failed:', error);
  // Try creating new database
  createFreshDatabase();
}
```

### 3. Agent Connection Failures

**Problem**: AI agents fail to connect or respond

**Diagnostics**:
```bash
# Test agent CLI directly
gemini --version
codex --version
qwen-code --version

# Check network connectivity
curl -I https://api.openai.com/v1/models
```

**Solutions**:
```typescript
// Agent connection with retry logic
async function connectAgent(agent: IAgent, maxRetries = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await agent.connect();
      return;
    } catch (error) {
      console.warn(`Agent connection attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

## 🎨 UI/UX Issues

### 1. React Component Rendering Issues

**Problem**: Components not rendering or showing blank content

**Diagnostics**:
```typescript
// Add error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

**Common Solutions**:
```typescript
// Check for undefined props
interface ComponentProps {
  data?: UserData;
}

const Component: React.FC<ComponentProps> = ({ data }) => {
  if (!data) {
    return <div>Loading...</div>;
  }
  
  return <div>{data.name}</div>;
};

// Use proper TypeScript types
const [messages, setMessages] = useState<TMessage[]>([]);
```

### 2. Styling Issues

**Problem**: CSS not applying or styles not loading

**Diagnostics**:
```bash
# Check if CSS files are being loaded
grep -r "import.*\.css" src/renderer/

# Check UnoCSS configuration
npm list | grep uno
```

**Solutions**:
```typescript
// Ensure CSS imports are correct
import './styles/global.css';
import './components/Component.module.css';

// Check UnoCSS configuration in uno.config.ts
export default {
  // configuration
};
```

### 3. Memory Leaks

**Problem**: Application consuming excessive memory

**Diagnostics**:
```bash
# Monitor memory usage
npm start -- --inspect=5858
# Open Chrome DevTools > Memory tab

# Check for memory leaks in React components
npm list | grep react
```

**Solutions**:
```typescript
// Proper cleanup in useEffect
useEffect(() => {
  const subscription = someService.subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Use React.memo for optimization
const MemoizedComponent = React.memo(({ data }: Props) => {
  return <div>{data.content}</div>;
});

// Avoid unnecessary re-renders
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);
```

---

## 🔌 Agent-Specific Issues

### 1. Gemini API Issues

**Problem**: Gemini API authentication or rate limit errors

**Diagnostics**:
```bash
# Check API key
echo $GEMINI_API_KEY

# Test API directly
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

**Solutions**:
```typescript
// API key validation
const validateGeminiKey = (apiKey: string): boolean => {
  return /^AIza[0-9A-Za-z_-]{35}$/.test(apiKey);
};

// Rate limiting
const rateLimiter = new Map<string, number[]>();
const checkRateLimit = (apiKey: string): boolean => {
  const now = Date.now();
  const requests = rateLimiter.get(apiKey) || [];
  const recentRequests = requests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 60) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimiter.set(apiKey, recentRequests);
  return true;
};
```

### 2. Codex Integration Issues

**Problem**: Codex CLI not found or authentication errors

**Diagnostics**:
```bash
# Check Codex installation
which codex
codex --version
codex auth status

# Test Codex CLI
codex "hello world"
```

**Solutions**:
```typescript
// Codex CLI path validation
const findCodexCli = (): string | null => {
  const possiblePaths = [
    'codex',
    '/usr/local/bin/codex',
    `${process.env.HOME}/.local/bin/codex`
  ];
  
  for (const path of possiblePaths) {
    try {
      fs.accessSync(path, fs.constants.X_OK);
      return path;
    } catch {
      continue;
    }
  }
  
  return null;
};

// Authentication retry logic
const authenticateCodex = async (maxRetries = 3): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await execAsync('codex auth status');
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('Codex authentication failed after retries');
        return false;
      }
      await sleep(2000);
    }
  }
  return false;
};
```

### 3. MCP Server Issues

**Problem**: MCP servers not connecting or not responding

**Diagnostics**:
```bash
# List MCP servers
codex mcp list

# Test MCP server
codex mcp test <server-name>

# Check MCP logs
tail -f ~/.codex/logs/mcp.log
```

**Solutions**:
```typescript
// MCP server health check
const checkMcpServerHealth = async (server: IMcpServer): Promise<boolean> => {
  try {
    const response = await fetch(`${server.transport.url}/health`, {
      headers: server.transport.headers,
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.error(`MCP server ${server.name} health check failed:`, error);
    return false;
  }
};

// MCP server reconnection logic
const reconnectMcpServer = async (server: IMcpServer): Promise<void> => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await server.connect();
      console.log(`MCP server ${server.name} connected successfully`);
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Failed to connect MCP server ${server.name} after ${maxRetries} attempts`);
      }
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
};
```

---

## 📱 Platform-Specific Issues

### 1. macOS Issues

**Problem**: Application not launching on macOS

**Diagnostics**:
```bash
# Check Gatekeeper status
spctl --status

# Check application signature
codesign --verify --deep AionUi.app

# Check crash logs
/Library/Logs/DiagnosticReports/AionUi/*
```

**Solutions**:
```bash
# Allow application to run
sudo spctl --master-disable
# Double-click the app, then re-enable
sudo spctl --master-enable

# Or use terminal to bypass Gatekeeper
xattr -d com.apple.quarantine AionUi.app
```

### 2. Windows Issues

**Problem**: Windows Defender blocking or application crashes

**Diagnostics**:
```powershell
# Check Windows Defender status
Get-MpPreference

# Add Windows Defender exception
Add-MpPreference -ExclusionPath "C:\Program Files\AionUi\"
```

**Solutions**:
```json
// Update electron-builder.yml for Windows
win: {
  target: "nsis",
  icon: "resources/icon.ico",
  publisherName: "AionUi Team",
  verifyUpdateCodeSignature: false
}
```

### 3. Linux Issues

**Problem**: Missing dependencies on Linux

**Diagnostics**:
```bash
# Check for missing libraries
ldd $(which AionUi)

# Install missing dependencies
sudo apt-get install libgtk-3-dev libnotify-dev libnss3-dev libxss1 libxtst6 xvfb
```

---

## 🔧 Development Tool Issues

### 1. ESLint/Prettier Issues

**Problem**: Linter errors not matching expectations

**Diagnostics**:
```bash
# Check ESLint version
npm list eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Test specific files
npx eslint src/renderer/components/Component.tsx

# Check Prettier configuration
npx prettier --check src/renderer/components/Component.tsx
```

**Solutions**:
```json
// .eslintrc.json - Ensure proper configuration
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "max-len": ["warn", { "code": 120 }]
  }
}
```

### 2. Testing Issues

**Problem**: Tests failing or not running

**Diagnostics**:
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- --testPathPattern=filename.test.ts

# Check test configuration
npx jest --showConfig
```

**Solutions**:
```typescript
// jest.config.js - Common configuration issues
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ]
};
```

---

## 📊 Performance Issues

### 1. Slow Startup

**Problem**: Application takes >10 seconds to start

**Diagnostics**:
```bash
# Profile startup time
time npm start

# Check what's happening during startup
npm start -- --enable-logging=verbose
```

**Solutions**:
```typescript
// Delayed loading of heavy modules
const loadHeavyModule = useMemo(() => {
  return import('./heavy-module').then(module => module.default);
}, []);

// Code splitting for large components
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Preload critical modules
const preloadCriticalModules = async () => {
  await Promise.all([
    import('./critical-module1'),
    import('./critical-module2')
  ]);
};
```

### 2. High Memory Usage

**Problem**: Memory usage exceeds 500MB

**Diagnostics**:
```bash
# Monitor memory during development
npm start -- --inspect=5858
# Open Chrome DevTools > Memory > Take snapshot

# Check for memory leaks
node --inspect lib/app.js
```

**Solutions**:
```typescript
// Memory leak detection
const useMemoryLeakDetection = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      if (performance.memory) {
        console.log('Memory usage:', {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576)
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);
};

// Cleanup event listeners
const EventListenerExample: React.FC = () => {
  const listenerRef = useRef<EventListener>(() => {});

  useEffect(() => {
    listenerRef.current = (event: Event) => {
      console.log('Event:', event);
    };
    
    window.addEventListener('resize', listenerRef.current);
    
    return () => {
      window.removeEventListener('resize', listenerRef.current);
    };
  }, []);
};
```

---

## 🚨 Emergency Procedures

### 1. Application Crashes on Critical Path

**Emergency Restart**:
```bash
# Force quit and clear caches
pkill -f AionUi
rm -rf ~/.aionui/cache
rm -rf ~/.aionui/temp

# Restart with clean state
npm start -- --clear-cache
```

### 2. Database Corruption

**Database Recovery**:
```bash
# Backup current database
cp ~/.aionui/database/chat.db ~/.aionui/database/chat.db.backup

# Create fresh database
rm ~/.aionui/database/chat.db
npm start -- --init-database

# Import backup if needed
sqlite3 ~/.aionui/database/chat.db ".backup ~/.aionui/database/chat.db.backup"
```

### 3. Configuration Reset

**Reset to Defaults**:
```bash
# Backup configuration
cp ~/.aionui/config.json ~/.aionui/config.json.backup

# Reset configuration
rm ~/.aionui/config.json
npm start -- --default-config
```

---

## 📞 Getting Help

### 1. Collect Debug Information

Create a debug bundle:
```bash
# Create debug information file
npm run debug:info > debug-info.txt 2>&1

# Include in bug reports
cat debug-info.txt
```

### 2. Report Issues

When reporting issues, include:
- **OS and version**
- **Node.js version** (`node --version`)
- **Application version**
- **Error messages** (full stack traces)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Debug information** (from above)

### 3. Community Support

- **GitHub Issues**: Create detailed issue with debug info
- **Discord Community**: Join for real-time help
- **Documentation**: Check relevant sections first

---

## 🔧 Development Debug Tools

### 1. Chrome DevTools

**Renderer Process Debugging**:
- Open DevTools: `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux)
- Network tab: Monitor API calls
- Console tab: Check for JavaScript errors
- Memory tab: Profile memory usage

### 2. Node.js Debugging

**Main Process Debugging**:
```bash
# Start with debugging
npm start -- --inspect=5858

# Connect Chrome DevTools to Node.js
chrome://inspect
```

### 3. React Developer Tools

**Component Debugging**:
- Install React Developer Tools browser extension
- Inspect component props and state
- Profile component performance
- Debug hook dependencies

---

**Last Updated**: 2025-01-29  
**Version**: 1.0  
**Maintainers**: AionUi Development Team  
**Contact**: Create GitHub issues with debug information