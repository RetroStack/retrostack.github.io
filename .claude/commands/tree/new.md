---
allowed-tools: Bash(git worktree:*), Bash(git push:*), Bash(git branch:*), Bash(mkdir:*), Bash(ls:*), Bash(pwd:*)
description: Create a new git worktree for parallel Claude Code development
argument-hint: <branch-name>
---

Create a new git worktree for parallel Claude Code development.

The user wants to create a worktree with branch name: $ARGUMENTS

## Instructions

1. **Parse the branch name:**
   - If $ARGUMENTS is empty, ask the user for a descriptive branch name
   - Sanitize the name: lowercase, replace spaces with hyphens, remove special characters except hyphens
   - Example valid names: `feature-login`, `bugfix-header`, `experiment-new-algo`

2. **Check prerequisites:**
   - Run `git branch --list <branch-name>` to verify the branch doesn't already exist
   - Run `git worktree list` to verify no worktree with this path exists
   - If either exists, inform the user and ask for a different name

3. **Create the worktree:**
   ```bash
   mkdir -p .tree
   git worktree add ".tree/<branch-name>" -b "<branch-name>"
   ```

4. **Push the new branch to remote:**
   ```bash
   git push -u origin "<branch-name>"
   ```
   Run this from within the new worktree directory.

5. **Display success message:**
   Show the user:
   - The full path to the new worktree
   - The command to start Claude Code there: `cd .tree/<branch-name> && claude`
   - A reminder to run `/tree:close` when done with the work

## Example Output

```
Created worktree for branch: feature-dark-mode
Path: /Users/.../retrostack-web/.tree/feature-dark-mode
Pushed to remote: origin/feature-dark-mode

To start Claude Code in this worktree:
  cd .tree/feature-dark-mode && claude

When done, run /tree:close to commit and cleanup.
```
