# ARCHITECTURE.md - AionUi Architecture Guide

**Created**: 2025-01-29  
**Purpose**: Deep dive into AionUi's architecture and component interactions  
**Target Audience**: Developers and architects

---

## 🏛️ System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AionUi Desktop Application               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Main Process   │  │ Renderer Process │  │  Worker Threads  │ │
│  │   (Electron)     │  │   (React)       │  │  (AI/Background) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Server    │  │   Local DB      │  │  File System    │ │
│  │   (Express)     │  │   (SQLite)      │  │   (Node.js)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Process Model

#### Main Process (Electron)

- **Responsibility**: Application lifecycle, system integration
- **Key Components**:
  - Window management
  - Menu and tray integration
  - System-level operations
  - Inter-process communication

#### Renderer Process (React)

- **Responsibility**: User interface, client-side logic
- **Key Components**:
  - React components
  - State management
  - UI routing
  - User interactions

#### Worker Threads

- **Responsibility**: Background processing, AI integrations
- **Key Components**:
  - AI agent connections
  - File processing
  - Heavy computations
  - Concurrent operations

---

## 🔧 Component Architecture

### 1. Main Process Components

#### Window Management

```typescript
// src/main/window-manager.ts
class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(): BrowserWindow {
    // Window creation logic
  }

  handleWindowEvents(): void {
    // Window event handling
  }
}
```

#### System Integration

```typescript
// src/main/system-integration.ts
class SystemIntegration {
  setupMenu(): void {
    // Native menu setup
  }

  setupTray(): void {
    // System tray integration
  }

  handleFileAssociation(): void {
    // File type associations
  }
}
```

### 2. Renderer Process Components

#### UI Layer Structure

```
src/renderer/
├── components/           # Reusable UI components
│   ├── base/            # Base components (Modal, Button, etc.)
│   ├── layout/          # Layout components (Header, Sidebar)
│   └── domain/          # Domain-specific components
├── pages/               # Page-level components
│   ├── conversation/    # Chat interface pages
│   ├── settings/        # Settings pages
│   └── login/           # Authentication pages
├── hooks/               # Custom React hooks
├── context/             # React context providers
├── services/            # API services
└── utils/               # Utility functions
```

#### State Management

```typescript
// src/renderer/context/ConversationContext.tsx
export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<TChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  return (
    <ConversationContext.Provider value={{ conversations, activeConversation, ... }}>
      {children}
    </ConversationContext.Provider>
  );
};
```

### 3. Agent System Architecture

#### Agent Interface

```typescript
// src/common/types/agent.ts
interface IAgent {
  readonly name: string;
  readonly type: AgentType;
  readonly capabilities: AgentCapabilities;

  connect(config: AgentConfig): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: string, options?: MessageOptions): Promise<string>;
  onMessage(callback: (message: AgentMessage) => void): void;
}
```

#### Agent Manager

```typescript
// src/agent/AgentManager.ts
class AgentManager {
  private agents: Map<string, IAgent> = new Map();
  private activeAgent: IAgent | null = null;

  registerAgent(agent: IAgent): void {
    // Agent registration logic
  }

  setActiveAgent(name: string): void {
    // Agent switching logic
  }

  routeMessage(message: string): Promise<string> {
    // Message routing logic
  }
}
```

#### Agent Implementations

```typescript
// src/agent/gemini/GeminiAgent.ts
export class GeminiAgent implements IAgent {
  async connect(config: GeminiConfig): Promise<void> {
    // Gemini-specific connection logic
  }

  async sendMessage(message: string): Promise<string> {
    // Gemini API integration
  }
}
```

### 4. Database Architecture

#### Schema Design

```sql
-- conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  extra TEXT -- JSON metadata
);

-- messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  metadata TEXT -- JSON metadata
);
```

#### Storage Layer

```typescript
// src/common/storage/ConversationStorage.ts
export class ConversationStorage {
  private db: Database;

  async createConversation(conversation: TChatConversation): Promise<void> {
    // Database insertion logic
  }

  async updateConversation(id: string, updates: Partial<TChatConversation>): Promise<void> {
    // Update logic with prepared statements
  }

  async getConversation(id: string): Promise<TChatConversation | null> {
    // Retrieval logic with type safety
  }
}
```

---

## 🔄 Data Flow Architecture

### 1. Message Flow

```
User Input → Renderer UI → IPC Bridge → Main Process → Agent Manager → AI Agent → Agent Response → Renderer UI
```

#### Detailed Flow

1. **User Input**: User types message in React UI
2. **IPC Bridge**: Message sent to main process via IPC
3. **Agent Manager**: Routes message to appropriate agent
4. **Agent Processing**: AI agent processes and generates response
5. **Response Return**: Response flows back through same path
6. **UI Update**: React updates with new message

### 2. File Processing Flow

```
File Upload → Validation → Storage → Preview Generation → Agent Context → Processing
```

#### Component Interaction

```typescript
// File upload handler
export const handleFileUpload = async (file: File): Promise<void> => {
  // 1. Validate file
  const validation = await validateFile(file);
  if (!validation.isValid) throw new Error(validation.error);

  // 2. Store file
  const filePath = await storeFile(file);

  // 3. Generate preview
  const preview = await generatePreview(file, filePath);

  // 4. Add to agent context
  await addFileToAgentContext(filePath, preview);

  // 5. Update UI
  updateFileList({ file, filePath, preview });
};
```

### 3. State Synchronization

#### Context-Based Synchronization

```typescript
// src/renderer/context/SyncContext.tsx
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const syncWithMainProcess = useCallback(async () => {
    setSyncState('syncing');
    try {
      const data = await ipcBridge.sync.getData.invoke();
      updateLocalState(data);
      setSyncState('synced');
    } catch (error) {
      setSyncState('error');
    }
  }, []);

  return (
    <SyncContext.Provider value={{ syncState, syncWithMainProcess }}>
      {children}
    </SyncContext.Provider>
  );
};
```

---

## 🔐 Security Architecture

### 1. Process Isolation

#### Context Isolation

```typescript
// src/preload.ts - Secure bridge
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('fs:writeFile', path, data),

  // Agent operations
  sendMessage: (agent: string, message: string) => ipcRenderer.invoke('agent:sendMessage', agent, message),

  // System operations
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
});
```

#### Permission Management

```typescript
// src/common/permissions/PermissionManager.ts
export class PermissionManager {
  private permissions: Map<string, Permission> = new Map();

  requestPermission(operation: string, context: PermissionContext): Promise<boolean> {
    // Permission request logic with user confirmation
  }

  checkPermission(operation: string, context: PermissionContext): boolean {
    // Permission checking logic
  }
}
```

### 2. Data Protection

#### Local First Storage

```typescript
// src/common/storage/SecureStorage.ts
export class SecureStorage {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  async store(data: any): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(data));
    // Store encrypted data locally
  }

  async retrieve(): Promise<any> {
    const encrypted = await this.readFromDisk();
    const decrypted = await this.decrypt(encrypted);
    return JSON.parse(decrypted);
  }
}
```

#### API Key Management

```typescript
// src/common/security/ApiKeyManager.ts
export class ApiKeyManager {
  private secureStore: SecureStorage;

  async storeApiKey(provider: string, apiKey: string): Promise<void> {
    const encryptedKey = await this.encrypt(apiKey);
    await this.secureStore.store(`${provider}_key`, encryptedKey);
  }

  async getApiKey(provider: string): Promise<string | null> {
    const encryptedKey = await this.secureStore.retrieve(`${provider}_key`);
    return encryptedKey ? await this.decrypt(encryptedKey) : null;
  }
}
```

---

## 🚀 Performance Architecture

### 1. Multi-Process Architecture

#### Worker Thread Utilization

```typescript
// src/agent/WorkerManager.ts
export class WorkerManager {
  private workers: Map<string, Worker> = new Map();

  createWorker(name: string, scriptPath: string): Worker {
    const worker = new Worker(scriptPath);
    this.workers.set(name, worker);
    return worker;
  }

  async executeInWorker<T>(name: string, task: WorkerTask): Promise<T> {
    const worker = this.workers.get(name);
    if (!worker) throw new Error(`Worker ${name} not found`);

    return new Promise((resolve, reject) => {
      worker.postMessage({ task });
      worker.once('message', (result) => resolve(result));
      worker.once('error', (error) => reject(error));
    });
  }
}
```

### 2. Memory Management

#### Component-Level Optimization

```typescript
// src/renderer/components/OptimizedChat.tsx
export const OptimizedChat: React.FC<ChatProps> = ({ conversationId }) => {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const messagesRef = useRef<TMessage[]>([]);

  // Virtual scrolling for message lists
  const virtualizedMessages = useVirtualScroll(messages, {
    itemHeight: MESSAGE_HEIGHT,
    threshold: 50
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      messagesRef.current = [];
      setMessages([]);
    };
  }, [conversationId]);

  return (
    <VirtualizedList
      items={virtualizedMessages}
      renderItem={renderMessage}
      onScroll={handleScroll}
    />
  );
};
```

### 3. Caching Architecture

#### Multi-Level Caching

```typescript
// src/common/cache/CacheManager.ts
export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private diskCache: DiskCache;

  async get<T>(key: string): Promise<T | null> {
    // 1. Check memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // 2. Check disk cache
    const diskEntry = await this.diskCache.get<T>(key);
    if (diskEntry) {
      // Promote to memory cache
      this.memoryCache.set(key, diskEntry);
      return diskEntry.data;
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    const entry: CacheEntry = { data, timestamp: Date.now(), ttl };
    this.memoryCache.set(key, entry);
    await this.diskCache.set(key, entry);
  }
}
```

---

## 🔄 Event Architecture

### 1. Event-Driven Communication

#### Custom Events

```typescript
// src/common/events/EventEmitter.ts
export class AppEventEmitter extends EventEmitter {
  emit(event: AppEvent, data?: any): boolean {
    // Event emission with logging
    console.log(`[EVENT] ${event}:`, data);
    return super.emit(event, data);
  }
}

// Event types
export type AppEvent = 'conversation:created' | 'agent:connected' | 'agent:disconnected' | 'message:sent' | 'error:occurred';
```

### 2. Agent Event System

#### Event Broker

```typescript
// src/agent/EventBroker.ts
export class EventBroker {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  publish(event: string, data: any): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }
}
```

---

## 🔌 Plugin Architecture

### 1. Agent Plugin System

#### Plugin Interface

```typescript
// src/plugins/PluginInterface.ts
export interface IAgentPlugin {
  readonly name: string;
  readonly version: string;
  readonly dependencies: string[];

  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;
  getCapabilities(): PluginCapabilities;
}
```

#### Plugin Manager

```typescript
// src/plugins/PluginManager.ts
export class PluginManager {
  private plugins: Map<string, IAgentPlugin> = new Map();
  private pluginRegistry: PluginRegistry;

  async loadPlugin(pluginName: string): Promise<void> {
    const plugin = await this.pluginRegistry.load(pluginName);
    await plugin.initialize(this.createContext());
    this.plugins.set(pluginName, plugin);
  }

  unloadPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.destroy();
      this.plugins.delete(pluginName);
    }
  }
}
```

### 2. MCP Integration

#### MCP Server Management

```typescript
// src/mcp/McpManager.ts
export class McpManager {
  private servers: Map<string, McpServer> = new Map();

  async addServer(config: McpServerConfig): Promise<void> {
    const server = new McpServer(config);
    await server.connect();
    this.servers.set(config.name, server);
  }

  async removeServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (server) {
      await server.disconnect();
      this.servers.delete(name);
    }
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server) throw new Error(`Server ${serverName} not found`);

    return await server.callTool(toolName, args);
  }
}
```

---

## 📊 Monitoring & Observability

### 1. Logging Architecture

#### Structured Logging

```typescript
// src/common/logging/Logger.ts
export class Logger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, { ...metadata, error: error?.stack });
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata,
    };

    // Send to logging service
    this.sendToLogger(logEntry);
  }
}
```

### 2. Performance Monitoring

#### Metrics Collection

```typescript
// src/common/monitoring/MetricsCollector.ts
export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();

  startTimer(name: string): Timer {
    return new Timer(name, (duration) => {
      this.recordMetric(name, duration);
    });
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push({
      value,
      timestamp: Date.now(),
    });
  }

  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }
}
```

---

## 🔧 Configuration Architecture

### 1. Configuration Management

#### Configuration Schema

```typescript
// src/common/config/ConfigSchema.ts
export interface AppConfig {
  development: {
    debug: boolean;
    hotReload: boolean;
    logLevel: LogLevel;
  };

  agents: {
    gemini: GeminiConfig;
    codex: CodexConfig;
    openai: OpenAIConfig;
  };

  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    fontSize: number;
  };

  security: {
    encryptionEnabled: boolean;
    sessionTimeout: number;
  };
}
```

#### Configuration Provider

```typescript
// src/common/config/ConfigProvider.ts
export class ConfigProvider {
  private config: AppConfig;
  private watchers: Map<string, ConfigWatcher[]> = new Map();

  constructor(initialConfig: AppConfig) {
    this.config = initialConfig;
  }

  get<T>(path: string): T {
    return this.getNestedValue(this.config, path);
  }

  set(path: string, value: any): void {
    this.setNestedValue(this.config, path, value);
    this.notifyWatchers(path, value);
  }

  watch(path: string, watcher: ConfigWatcher): void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }
    this.watchers.get(path)!.push(watcher);
  }
}
```

---

## 🏗️ Build & Deployment Architecture

### 1. Build Pipeline

#### Webpack Configuration

```typescript
// webpack.config.ts - Main build configuration
export const mainConfig: Configuration = {
  mode: process.env.NODE_ENV as 'development' | 'production',
  entry: './src/main/index.ts',
  target: 'electron-main',
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};
```

### 2. Release Architecture

#### Automated Release Pipeline

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run dist

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.os }}
          path: dist/

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: dist/**/*
```

---

This architecture guide provides a comprehensive overview of AionUi's technical design and component interactions. It serves as a reference for understanding how different parts of the system work together and how to extend or modify the architecture.

**Last Updated**: 2025-01-29  
**Version**: 1.0  
**Maintainers**: AionUi Development Team
