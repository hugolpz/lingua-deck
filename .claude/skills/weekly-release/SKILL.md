---
name: weekly-release
description: Commit the pending working tree as grouped conventional commits, then write the matching /changelog entries in src/modules/changelog/data/releases.js. Use when the user asks to commit the week's changes and update the changelog.
---

# Weekly release: commits + changelog

Node is not always on PATH: `export PATH=$HOME/.nvm/versions/node/v22.13.0/bin:$PATH` before `npx`.

1. **Survey**: `git status`, `git diff --stat`, untracked files, and `git log` since the date of the top entry of `src/modules/changelog/data/releases.js`.
2. **Group and commit**: split the tree into coherent conventional commits (`feat|fix|refactor|docs|chore(scope): summary`, scope = module folder). Show the proposed list and wait for confirmation. Never commit `.env`, gitignored data (`upload_errors*.log|json`), scratch files, or debug logging that prints secrets (check `vite.config.js`). Ask when unsure. End each message with the Co-Authored-By trailer from the session reminder.
3. **Changelog**: edit `releases.js` (newest first; shape documented in `components/ReleaseMessage.vue`):
   - add to or create the month entry (`id: 'YYYY-MM'`, `kind: 'month'`): `users[]` in plain English for end users, `technical[]` for developers, new short SHAs appended to `commits[]`;
   - one `days[]` entry per active day (`id: 'YYYY-MM-DD'`, `kind: 'day'`), with `reconstructed: true` only when written after the fact.
4. **Commit the changelog** alone: `docs(changelog): add messages for <period>`.
5. **Verify**: `npx vite build`, then check `/changelog` renders the new entry and the SHAs link.
