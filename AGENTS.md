# Instructions for AI coding agents

- Keep the application simple.
- Prefer readable code over clever code.
- Avoid unnecessary dependencies.
- Do not rewrite working functionality without a reason.
- Reuse existing components.
- Preserve LocalStorage behavior.
- Maintain TypeScript type safety.
- Inspect existing code before making changes.
- Make the smallest reasonable change.
- Run tests and type checks after changes.
- Do not introduce unnecessary architecture.

For task behavior, recurrence, deadlines, progress, and LocalStorage changes, inspect `src/taskData.ts` and its tests before editing. Use the existing npm scripts:

```sh
npm test
npm run typecheck
npm run build
```
