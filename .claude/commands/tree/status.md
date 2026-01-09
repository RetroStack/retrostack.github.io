---
allowed-tools: Bash(git:*), Bash(ls:*)
description: Check detailed status of git worktrees
argument-hint: [worktree-name]
---

Show detailed status of a specific worktree or all worktrees.

The user wants status for: $ARGUMENTS

## Instructions

1. **Determine which worktree(s) to check:**
   - If $ARGUMENTS is provided, check only `.tree/<argument>`
   - If $ARGUMENTS is empty, check all worktrees in `.tree/`

2. **For each worktree, gather information:**

   a. **Uncommitted changes:**
   ```bash
   git -C ".tree/<name>" status --porcelain
   ```

   b. **Unpushed commits:**
   ```bash
   git -C ".tree/<name>" log origin/<branch>..HEAD --oneline 2>/dev/null
   ```

   c. **Behind remote (needs pull):**
   ```bash
   git -C ".tree/<name>" fetch origin <branch> 2>/dev/null
   git -C ".tree/<name>" log HEAD..origin/<branch> --oneline 2>/dev/null
   ```

   d. **Branch info:**
   ```bash
   git -C ".tree/<name>" branch --show-current
   ```

3. **Display detailed status for each worktree:**
   Show:
   - Branch name
   - Uncommitted changes (list files if any)
   - Unpushed commits (count and summary)
   - Commits behind remote (if any)
   - Recommendations (what actions to take)

4. **Provide recommendations:**
   - If uncommitted changes: "Run /tree:close to commit and push"
   - If unpushed commits: "Changes need to be pushed"
   - If behind remote: "Consider pulling latest changes"
   - If clean and up-to-date: "Ready to close or continue working"

## Example Output (Single Worktree)

```
Status for: feature-dark-mode

  Branch: feature-dark-mode

  Uncommitted Changes (3 files):
    M src/components/ThemeToggle.tsx
    A src/hooks/useDarkMode.ts
    M src/app/globals.css

  Unpushed Commits: 2
    abc1234 Add dark mode toggle component
    def5678 Create useDarkMode hook

  Behind Remote: 0 commits

  Recommendation: Run /tree:close to commit remaining changes and push.
```

## Example Output (All Worktrees)

```
Worktree Status Summary:

  feature-dark-mode
    - 3 uncommitted changes
    - 2 unpushed commits
    - Action needed: commit and push

  bugfix-header
    - Clean, up-to-date
    - Ready to close

  experiment-algo
    - Clean locally
    - 5 commits behind remote
    - Action needed: pull latest changes
```

## Notes

- Use `git -C <path>` to run commands in the worktree without changing directories
- Handle cases where remote tracking branch doesn't exist yet (new branches)
- Provide actionable recommendations for each worktree
