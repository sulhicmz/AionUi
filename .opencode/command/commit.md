# Smart Commit Command

## Description
AI-powered commit message generation and code review before committing.

## Usage
```
commit [options] [files...]
```

## Options
- `--review`: Perform code review before committing
- `--message`: Generate commit message automatically
- `--type`: Specify commit type (feat, fix, docs, etc.)

## Implementation
```typescript
interface CommitCommand {
  review(files: string[]): Promise<ReviewResult>;
  generateMessage(diff: string): Promise<string>;
  commit(message: string, files: string[]): Promise<void>;
}