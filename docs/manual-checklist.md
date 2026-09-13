# Browser checks before publishing

- Start the local server and view at desktop and narrow mobile widths.
- Confirm all six sample snippets appear, with no console errors.
- Create a snippet containing Lithuanian letters and literal HTML tags. Confirm it appears as text, not markup; reload and verify preservation.
- Edit, favorite, filter, search using two words, and change sorting.
- Duplicate a snippet, delete it, then undo. Confirm editor cancel/Escape asks before discarding changes.
- Copy code and compare the pasted content, including whitespace.
- Export, modify one snippet, and reimport. Confirm existing content is retained and exact duplicates are skipped.
- Import malformed JSON: the existing shelf must remain intact.
- Test keyboard tab order, dialog focus, Escape, search shortcut and code scrolling.
- Open two tabs. Save in one; confirm the other refreshes when no editor is open and warns when editing.
- Test a browser profile with storage unavailable. Confirm the session-only warning and working export.

These are manual acceptance checks, not claims of completed browser tests.
