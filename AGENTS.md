# Working on Janus

Janus is a clickable prototype of a "Revolut for company insurance" app, built for Nova SBE's Product Management in Technology course. Several people build it, each with their own coding agent. This file is for those agents.

Live site: https://janus.jose-maria-martins.workers.dev

## The flow: branch → preview → PR → "is this final?" → merge

Never commit to `main` directly. Every change, however small, goes through this flow.

1. **Start a branch** named after the work, in lowercase letters, digits and hyphens only. For example, "make the buy menu better" becomes `buy-menu`.
   ```bash
   git switch main && git pull
   git switch -c buy-menu
   ```
2. **Build it.** Commit as you go, with messages that say what changed for the user.
3. **Check it** before pushing. Both must pass:
   ```bash
   npm run build
   npm run lint
   ```
4. **Push and open a PR:**
   ```bash
   git push -u origin buy-menu
   gh pr create --fill
   ```
5. **Get the preview link.** Cloudflare builds every branch in about a minute, at:
   ```
   https://<branch>-janus.jose-maria-martins.workers.dev
   ```
   For example, `https://buy-menu-janus.jose-maria-martins.workers.dev`. Wait for the "Workers Builds: janus" check to pass (`gh pr checks --watch`), then open the link yourself to make sure your change is there.
6. **Ask your human.** Send them the preview link and ask: *"Here's the preview: <link>. Is this the final version, or should I change something?"* If they want changes, make them, push again (the same link updates), and ask again.
7. **Merge only after a clear yes:**
   ```bash
   gh pr merge --squash --delete-branch
   ```
   About a minute later the change is on the live site. Tell your human it's live and give them the link.

If `main` moved while you worked and the PR has conflicts, merge `main` into your branch, fix the conflicts, push, and check the preview again before asking.

Never run `npm run deploy` or `wrangler deploy`. Cloudflare deploys `main` by itself.

## Rules

- **Ask your human before adding any library.** Use what's already in `package.json`.
- **Ask before you build** if the request is unclear. Short, simple questions.
- **Don't reformat.** Never run prettier or reformat code you didn't change. Match the style around you.
- **Keep changes small and on one topic.** One screen or one feature per branch. Two people editing `src/data/mock.json` at the same time is the most common cause of conflicts.
- **Test at phone width (375px) and on desktop.** Nothing may scroll sideways.

## How the app is built

- **Stack:** Vite, React 19, TypeScript, Tailwind v4, React Router v7 (import from `react-router`), shadcn/ui (`radix-nova` style), lucide-react icons and `motion`.
- **No backend.** All data comes from `src/data/mock.json`. Dates in it are relative to `anchorDate` and shift to today, so the demo never goes stale. Anything the user changes lives in the store (`src/data/store.ts`: `useStore`, `setState`) and is saved in the browser. **Profile → Reset demo** clears it.
- **Screens** live in `src/screens/<area>/`. Routes are in `src/App.tsx`.
- **Look:** dark only, with a palette taken from Revolut's dark app. Use the colour tokens in `src/index.css`. Never hard-code colours.
- **Reuse these components** before making new ones:
  - Pages: `TabScreen`, `PushScreen` and `Widget` (`src/components/Screen.tsx`), and `FlowScreen` / `FlowHeading` for step-by-step flows.
  - Rows: shadcn `Item` (`ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`), `RowTitle` for a title with an amount, `IconCircle`, `InsurerLogo`, `PolicyIcon` and `DocRow`.
  - Overlays and endings: `BottomSheet`, then `SuccessView` when a flow finishes.
- **Buttons:** the main action is `<Button size="lg" className="w-full">`, and secondary actions use `variant="link"`.
- **New shadcn components:** `npx shadcn@latest add <name>`.
- **Words:** short, plain English that a busy company owner understands at a glance. No insurance jargon.
