---
allowed-tools: Bash(git:*), Bash(ls:*)
description: List all git worktrees with their status
---

List all git worktrees and show their current status.

## Instructions

1. **Get the list of worktrees:**
   ```bash
   git worktree list
   ```

2. **For each worktree, check its status:**
   For each path returned (except the main repo), run:
   ```bash
   git -C "<path>" status --porcelain
   ```
   Count the number of changed files to determine if it's "clean" or has uncommitted changes.

3. **Display a formatted summary:**
   Show a table or list with:
   - Path (show relative path for .tree/ worktrees)
   - Branch name
   - Status: "clean" or "N dirty" (where N is the number of changed files)

4. **If no worktrees exist in .tree/:**
   Show a message like "No worktrees found. Use /tree:new to create one."

## Example Output

```
Git Worktrees:

  Main Repo:
    Path:   /Users/.../retrostack-web
    Branch: main
    Status: clean

  Worktrees in .tree/:
    feature-dark-mode
      Branch: feature-dark-mode
      Status: 3 uncommitted changes

    bugfix-header
      Branch: bugfix-header
      Status: clean

Use /tree:close <name> to close a worktree.
Use /tree:status <name> for detailed status.
```

## Notes

- The main repository is always listed first and marked separately
- Worktrees in .tree/ are listed with just their name (not full path)
- Status should indicate number of uncommitted changes, not just "dirty"
