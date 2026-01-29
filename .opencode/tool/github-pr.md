# GitHub PR Tool

## Description
Tool for managing GitHub pull requests, including creation, review, and merging.

## Capabilities
- Create pull requests
- Review pull requests
- Merge pull requests
- PR status management

## Implementation
```typescript
interface GitHubPRTool {
  createPR(options: CreatePROptions): Promise<PullRequest>;
  reviewPR(prNumber: number, review: Review): Promise<void>;
  mergePR(prNumber: number, method: MergeMethod): Promise<void>;
  getPRStatus(prNumber: number): Promise<PRStatus>;
}