# Repository Guidelines

## Project Structure & Module Organization
Source files live in `src/`, with `main.tsx` bootstrapping React and `App.tsx` assembling feature routes under `src/pages`. Shared UI sits in `src/components`, state helpers in `src/utils` and `src/trie`, persistent configuration in `src/constants`, and context providers in `src/contexts`. Place assets such as icons or JSON fixtures inside `src/assets`, and keep test-only helpers in `src/test`. Built artifacts are emitted to `dist/` via Vite; nothing in that folder should be edited manually.

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server (served at `http://localhost:5173`) with hot reload.
- `npm run build` — perform a TypeScript project build (`tsc -b`) and produce the optimized bundle.
- `npm run preview` — serve the production build locally for sanity checks.
- `npm run lint` — run ESLint using `eslint.config.js` across TypeScript, JSX, and config files.
- `npm run qa-fix` — convenience pipeline that runs lint and the full Vitest suite; use before every push.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation and favor functional React components typed with `FC` generics or explicit prop types from `src/types`. Use `PascalCase` for components (`StateGraph.tsx`), `camelCase` for utilities (`formatHash.ts`), and kebab-case for asset filenames. Prefer Tailwind utility classes for styling; when SCSS is needed, colocate it near the component. Maintain strict ESLint compliance (including React Hooks rules) and keep imports sorted logically: framework, third-party, shared components, then local utilities.

## Testing Guidelines
Vitest plus Testing Library drive our unit and integration tests. Co-locate specs as `*.test.tsx` next to the implementation or place reusable fixtures in `src/test`. Use descriptive `describe` blocks mirroring component names and ensure async UI flows assert via `findBy*`. Run `npm run test` for CI-equivalent coverage, `npm run test:watch` while iterating, and `npm run test:coverage` when touching critical parsing logic (target >90% statements within `src/utils` and `src/trie`).

## Commit & Pull Request Guidelines
Follow the existing history that mixes short imperatives (`running block WiP`) with Conventional Commit prefixes (`build(deps): bump js-yaml …`). Choose the style that best matches your change, but always start with a concise verb phrase and scope. Every PR should include: a problem statement, a bullet summary of changes, screenshots or GIFs for UI tweaks, linked issues, and explicit test evidence (command output or QA notes). Rebase before requesting review, ensure `npm run qa-fix` passes, and highlight any new config flags or migration steps for deployers.

## Security & Configuration Notes
Never commit state dumps or fixtures containing private keys; anonymize addresses before uploading samples into `src/assets`. Configuration values exposed to the browser must be prefixed with `VITE_`; document any new ones in the README and provide safe defaults in `vite.config.ts`. Use TypeScript’s `zod` validators when parsing user-provided JSON so malformed data cannot crash visualizers.
