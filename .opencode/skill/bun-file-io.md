# Bun File I/O Skill

## Description
Advanced file I/O operations using Bun runtime for improved performance.

## Capabilities
- High-performance file operations
- Batch file processing
- Streaming file operations
- File system utilities

## Implementation
```typescript
interface BunFileIOSkill {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  batchRead(paths: string[]): Promise<string[]>;
  streamRead(path: string): Promise<ReadableStream>;
  streamWrite(path: string, stream: ReadableStream): Promise<void>;
}