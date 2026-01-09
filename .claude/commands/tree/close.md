---
allowed-tools: Bash(git:*), Bash(cd:*), Bash(rm:*), Bash(pwd:*), Bash(ls:*), Bash(gh pr:*)
description: Safely close a git worktree (auto-commit, push, remove)
argument-hint: [worktree-name]
---

Safely close a git worktree by auto-committing any changes, pushing to remote, and removing it.

The user wants to close worktree: $ARGUMENTS

## Instructions

1. **Determine which worktree to close:**
   - If $ARGUMENTS is provided, look for `.tree/<argument>`
   - If $ARGUMENTS is empty, run `git worktree list` and show the user the available worktrees (excluding the main repo), then ask which one to close
   - Do NOT close the main repository worktree (the one without `.tree/` in the path)

2. **Verify the worktree exists:**
   ```bash
   git worktree list
   ls .tree/
   ```
   If the specified worktree doesn't exist, inform the user and list available options.

3. **Check for uncommitted changes in the worktree:**
   ```bash
   git -C ".tree/<name>" status --porcelain
   ```

4. **If there are uncommitted changes (auto-commit):**
   - Show the user what files have changes
   - Auto-generate a commit message: `WIP: <branch-name> work in progress`
   - Stage and commit:
     ```bash
     git -C ".tree/<name>" add -A
     git -C ".tree/<name>" commit -m "WIP: <branch-name> work in progress"
     ```

5. **Check for unpushed commits:**
   ```bash
   git -C ".tree/<name>" log origin/<branch-name>..HEAD --oneline
   ```

6. **Push to remote if there are unpushed commits:**
   ```bash
   git -C ".tree/<name>" push
   ```

7. **Remove the worktree:**
   ```bash
   git worktree remove ".tree/<name>"
   ```

8. **Ask if user wants to create a PR:**
   Ask the user if they want to create a pull request for this branch.
   - If yes, run: `gh pr create --head <branch-name> --web`
   - If no, just confirm the worktree was closed successfully

## Example Output

```
Closing worktree: feature-dark-mode

Checking for uncommitted changes...
Found 3 uncommitted files:
  M src/components/ThemeToggle.tsx
  A src/hooks/useDarkMode.ts
  M src/app/globals.css

Auto-committing: "WIP: feature-dark-mode work in progress"
Pushing to remote...
Removing worktree...

Done! Worktree closed successfully.
Branch feature-dark-mode is available on remote.

Would you like to create a pull request for this branch?
```

## Important Notes

- NEVER close the main repository worktree
- Always auto-commit without prompting (per user preference)
- The branch remains on remote after closing - it's not deleted
- Use `git -C <path>` to run git commands in the worktree without changing directories
