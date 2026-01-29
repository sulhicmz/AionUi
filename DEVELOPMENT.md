# DEVELOPMENT.MD - Developer Onboarding Guide

**Created**: 2025-01-29  
**Purpose**: Comprehensive developer onboarding for AionUi project  
**Target Audience**: New developers joining the AionUi project

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.x or 20.x (recommended: 20.x)
- **npm**: Latest version (automatically managed)
- **Git**: For version control
- **Editor**: VS Code recommended (with extensions listed below)

### VS Code Extensions

```json
{
  "recommendations": ["esbenp.prettier-vscode", "dbaeumer.vscode-eslint", "ms-vscode.vscode-typescript-next", "bradlc.vscode-tailwindcss", "ms-vscode.vscode-json", "redhat.vscode-yaml"]
}
```

---

## 📋 Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/iOfficeAI/AionUi.git
cd AionUi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration as needed
nano .env
```

### 4. Start Development Server

```bash
# Start the application in development mode
npm start

# Or start with specific CLI arguments
npm run cli -- --webui
```

---

## 🏗️ Architecture Overview

### Project Structure

```
AionUi/
├── src/                    # Main source code
│   ├── main/              # Electron main process
│   ├── renderer/          # React frontend
│   ├── common/            # Shared utilities and types
│   ├── agent/             # AI agent implementations
│   ├── process/           # Background processes
│   ├── webserver/         # API server
│   ├── worker/            # Worker threads
│   └── types/             # TypeScript type definitions
├── docs/                  # Documentation
├── tests/                 # Test files
├── resources/             # Static assets
├── scripts/               # Build and utility scripts
└── .github/               # GitHub workflows
```

### Core Components

#### 1. Main Process (`src/main/`)

- **Purpose**: Electron application lifecycle management
- **Key Files**: `index.ts`, window management, system integration
- **Responsibilities**: Window creation, menu setup, system tray

#### 2. Renderer Process (`src/renderer/`)

- **Purpose**: React-based user interface
- **Key Directories**:
  - `pages/`: Application pages (conversation, settings, etc.)
  - `components/`: Reusable UI components
  - `hooks/`: Custom React hooks
  - `context/`: React context providers

#### 3. Agent System (`src/agent/`)

- **Purpose**: AI agent integration layer
- **Key Components**:
  - `acp/`: Agent Control Protocol implementation
  - `codex/`: Codex AI agent
  - `gemini/`: Google Gemini integration

#### 4. Common Utilities (`src/common/`)

- **Purpose**: Shared code across processes
- **Key Areas**:
  - `types/`: TypeScript definitions
  - `chatLib.ts`: Chat message handling
  - `storage.ts`: Database operations

---

## 🔧 Development Workflow

### 1. Code Quality Standards

#### ESLint Configuration

- **Maximum Line Length**: 120 characters
- **Type Safety**: Strict TypeScript enabled
- **Import Rules**: Type imports enforced
- **Code Formatting**: Prettier integration

#### Prettier Configuration

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing Commas**: ES5 compatible

### 2. Available Scripts

```bash
# Development
npm start              # Start development server
npm run cli            # Start with CLI arguments
npm run webui          # Start web UI mode

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format with Prettier
npm run format:check   # Check formatting

# Testing
npm test               # Run unit tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Generate coverage report

# Building
npm run package        # Package application
npm run dist           # Create distributables
npm run build          # Full build process
```

### 3. Git Workflow

#### Branch Strategy

- **main**: Stable release branch
- **develop**: Development integration branch
- **feature/**: Feature development branches
- **hotfix/**: Critical bug fixes

#### Commit Guidelines

- Use conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Examples:
  - `feat(renderer): add dark mode toggle`
  - `fix(agent): resolve null reference in codex handler`
  - `docs(readme): update installation instructions`

### 4. Code Review Process

#### Before Submitting PR

1. Run linting: `npm run lint:fix`
2. Run tests: `npm test`
3. Update documentation as needed
4. Squash related commits

#### Review Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] TypeScript types are properly defined

---

## 🧪 Testing Strategy

### Test Organization

```
tests/
├── unit/               # Unit tests
│   ├── test_*.test.ts
│   └── __tests__/
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
└── fixtures/          # Test data
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=filename

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Guidelines

#### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Focus on business logic
- Aim for 80%+ code coverage

#### Integration Tests

- Test component interactions
- Test database operations
- Test API endpoints
- Use test databases/fixtures

---

## 🐛 Debugging Guide

### 1. Development Tools

#### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main/index.ts",
      "cwd": "${workspaceFolder}",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/src/renderer"
    }
  ]
}
```

#### Browser DevTools

- Open DevTools in the application
- Use React Developer Tools extension
- Network tab for API debugging
- Console for error tracking

### 2. Common Issues

#### Build Failures

```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear Electron cache
npm run clean --cache
```

#### Test Failures

```bash
# Update test snapshots
npm test -- --updateSnapshot

# Run tests with detailed output
npm test -- --verbose
```

#### Database Issues

```bash
# Reset database
npm run reset-database

# Check database schema
npm run check-schema
```

### 3. Logging

#### Development Logging

```typescript
// For development
console.log('[DEBUG] Component initialized');

// For production
import { logger } from '@/common/utils/logger';
logger.info('Component initialized', { component: 'ChatComponent' });
```

#### Error Handling

```typescript
try {
  // Code that might fail
} catch (error) {
  logger.error('Operation failed', { error, context: 'component-x' });
  // Proper error recovery
}
```

---

## 📚 Key Concepts

### 1. Electron Architecture

#### Process Model

- **Main Process**: Application lifecycle, system integration
- **Renderer Process**: UI rendering, user interactions
- **Preload Scripts**: Secure bridge between main and renderer
- **Worker Threads**: Background processing

#### Security Best Practices

```typescript
// Secure preload script
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: string) => ipcRenderer.invoke('dialog:saveFile', data),
});
```

### 2. React Patterns

#### Component Architecture

```typescript
// Functional component with hooks
const ChatComponent: React.FC<ChatProps> = ({ conversation }) => {
  const [messages, setMessages] = useState<TMessage[]>([]);

  useEffect(() => {
    // Component lifecycle
  }, [conversation.id]);

  return (
    <div className="chat-container">
      {/* JSX content */}
    </div>
  );
};
```

#### State Management

- Use React Context for global state
- Local state with useState/useReducer
- External state with SWR for server data

### 3. TypeScript Best Practices

#### Type Definitions

```typescript
// Prefer interfaces over type aliases for objects
interface Message {
  id: string;
  content: string;
  timestamp: number;
}

// Use type aliases for unions/primitives
type MessageType = 'user' | 'assistant' | 'system';

// Generic types for reusable components
interface Props<T> {
  data: T[];
  onSelect: (item: T) => void;
}
```

---

## 🔌 Plugin Architecture

### Agent Integration

#### Adding New Agents

1. Create agent directory under `src/agent/`
2. Implement agent interface
3. Register in agent manager
4. Add configuration options

#### Agent Interface

```typescript
interface IAgent {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: string): Promise<string>;
  onMessage(callback: (message: string) => void): void;
}
```

### MCP Integration

#### MCP Server Structure

```typescript
interface IMcpServer {
  name: string;
  transport: TransportConfig;
  tools: ToolDefinition[];
  capabilities: ServerCapabilities;
}
```

---

## 🚀 Deployment

### Build Process

#### Development Build

```bash
npm run package
```

#### Production Build

```bash
npm run dist
```

#### Platform-Specific Builds

```bash
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

### Release Process

#### Automated Release

1. Push to `main` branch
2. GitHub Actions CI/CD runs
3. Automatic version bump (if configured)
4. Build and publish releases

#### Manual Release

```bash
# Version bump
npm version patch|minor|major

# Build and publish
npm run dist
```

---

## 🤝 Contributing

### Getting Help

1. **Documentation**: Check `docs/` directory
2. **Issues**: Search existing issues before creating new ones
3. **Discord**: Join community Discord for real-time help
4. **Code Review**: Request review from maintainers

### First Contribution

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Create Pull Request

### Community Guidelines

- Be respectful and inclusive
- Follow code of conduct
- Help others learn and grow
- Provide constructive feedback

---

## 📖 Additional Resources

### Documentation

- [API Documentation](./docs/api/)
- [Architecture Guide](./docs/architecture.md)
- [Component Library](./docs/components/)
- [Troubleshooting](./docs/troubleshooting.md)

### External Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎯 Next Steps

After completing this guide:

1. **Explore the codebase**: Start with simple components
2. **Run the tests**: Understand the testing patterns
3. **Make a small change**: Fix a bug or add a minor feature
4. **Submit a PR**: Experience the full development cycle
5. **Join the community**: Connect with other developers

Welcome to the AionUi development team! 🎉

---

**Last Updated**: 2025-01-29  
**Maintainers**: AionUi Development Team
**Contact**: Create GitHub issues or join Discord community
