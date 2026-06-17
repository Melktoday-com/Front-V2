<!-- rtk-instructions v2 -->

# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```

<!-- /rtk-instructions -->

# Copilot Instructions — Next.js + TypeScript (Production Grade)

You are an engineering partner on a production-grade Next.js + TypeScript codebase. Your output must read like it was written by a senior engineer who cares about correctness, long-term maintainability, and a reusable component system — not someone optimizing for "it compiles."

When in doubt, choose the option that is **boring, explicit, and consistent with the rest of the codebase** over the option that is clever.

---

## 1. Core Principles

- Correctness and clarity beat cleverness, always.
- Inspect the existing codebase before writing anything. Follow established patterns; do not invent new ones unless none exist.
- Never duplicate logic, types, or UI. If something is used twice, it belongs in a shared module.
- Keep every unit of code (component, hook, function) small and single-purpose.
- If a requirement is ambiguous, implement the version that is easiest to extend later, and say what you assumed.
- Do not silently change behavior. If a fix requires a behavior change, call it out explicitly.

---

## 2. TypeScript Standards (Strict Mode, No Exceptions)

- `strict: true` in `tsconfig.json` is non-negotiable. Never write code that only works by disabling strict checks.
- `any` is banned. If a type is genuinely unknown (external data, JSON, untyped libs), use `unknown` and narrow it with type guards or schema validation (e.g. `zod`).
- Every function has explicit parameter and return types. Do not rely on inference for public/exported APIs — only allow inference for trivial local variables.
- Model the domain with real types, not loose primitives:
  - Use discriminated unions for state machines (`{ status: "idle" } | { status: "loading" } | { status: "success"; data: T } | { status: "error"; error: string }`) instead of multiple booleans.
  - Use branded/opaque types for IDs that must not be interchangeable (`type UserId = string & { __brand: "UserId" }`) when mixing up IDs is a real risk.
  - Prefer `readonly` and `as const` for data that should never mutate.
- Avoid type assertions (`as`). If one is unavoidable, comment why, and prefer a type guard function instead.
- Centralize shared/domain types in a dedicated `types/` (or `domain/`) layer; keep component-local types colocated with the component.
- Validate all data crossing a trust boundary (API responses, form input, env vars, query params) with a schema library (`zod`) and derive the TypeScript type from the schema (`z.infer<typeof schema>`), so the runtime check and the compile-time type can never drift apart.
- Use utility types (`Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, etc.) instead of redeclaring near-identical interfaces.
- Generics are welcome when they remove real duplication (e.g. a generic `useFetch<T>` or `Table<T>` component) but are forbidden when they only add ceremony to a single concrete use case.

---

## 3. Next.js (App Router) Standards

- Default to **Server Components**. Add `"use client"` only at the smallest possible leaf that actually needs interactivity, state, effects, or browser APIs — never at the top of a page just to make one child interactive.
- Push data fetching as close to the server boundary as possible; avoid client-side `useEffect` fetching when a server component or Server Action can do the job.
- Use Server Actions for mutations where appropriate, with explicit input validation (`zod`) before touching any data layer.
- Use route-level `loading.tsx`, `error.tsx`, and `not-found.tsx` for every route segment that can realistically be slow, fail, or 404 — do not rely on a single global fallback.
- Be intentional about caching and revalidation (`fetch` cache options, `revalidatePath`, `revalidateTag`, route segment config). Never introduce accidental `force-dynamic` behavior by using non-cacheable APIs without realizing it.
- Use `next/image`, `next/link`, `next/font`, and other built-in primitives instead of manual `<img>`, `<a>`, or hand-rolled font loading, unless there's a documented reason not to.
- Every page needs correct semantic HTML and a `generateMetadata`/`metadata` export — title, description, and OpenGraph fields at minimum.
- Co-locate route-specific server logic in the route's own files; only promote to a shared `services/` layer once it's reused by more than one route.

---

## 4. Component Design & Reusability

This is the area where "خفن" TypeScript pays off most — components should be typed so well that misuse is impossible.

- **Composition over configuration.** Prefer multiple small composable components (e.g. `Card`, `Card.Header`, `Card.Body`) over one component with 15 boolean props.
- **Props contract first.** Define a precise `Props` interface before writing the JSX. Use discriminated unions for mutually exclusive prop combinations instead of "if propA, propB is required" comments:
  ```ts
  type ButtonProps =
    | { variant: "link"; href: string; onClick?: never }
    | { variant: "action"; href?: never; onClick: () => void };
  ```
- **Generic, reusable primitives** (`Button`, `Input`, `Select`, `Modal`, `Table<T>`, `DataList<T>`) live in a shared `components/ui` (or `components/base`) directory and accept only the props they actually need — no app-specific business logic inside them.
- **Variant styling** is handled through a single typed source of truth (e.g. `class-variance-authority`/`cva`) rather than scattered conditional class strings, so variants are discoverable via autocomplete and impossible to typo.
- **Forward refs** on any base component that wraps a native interactive element (`button`, `input`, `a`) so consumers can attach refs, focus management, and form libraries correctly.
- Separate **presentational** components (pure, typed props in → JSX out, no data fetching) from **container/feature** components (own the data, pass typed props down). Presentational components should be trivially reusable across features.
- Only extract a shared component once there are two real call sites — do not pre-abstract speculative reuse.
- Every interactive component is accessible by default: correct semantic element, label association, keyboard operability (`Tab`/`Enter`/`Escape` where relevant), visible focus state, and ARIA attributes only when semantic HTML isn't enough.

---

## 5. Folder & Code Organization

Follow the existing structure first. If the project doesn't have one yet, use this as the default:

```
src/
  app/                 # routes (App Router)
  components/
    ui/                # generic, reusable, app-agnostic primitives
    features/<feature>/ # feature-specific composite components
  hooks/               # reusable client hooks
  lib/                 # framework-agnostic utilities, helpers
  services/            # API clients / data access layer
  types/                # shared domain types
  constants/
  schemas/             # zod schemas (source of truth for types + validation)
```

- No ad-hoc folders or one-off naming conventions. If a new top-level folder seems necessary, justify it against the structure above first.
- Business logic never lives inside `components/ui`. UI primitives stay app-agnostic and exportable to another project unchanged.
- Don't duplicate logic across features — if `features/users` and `features/conferences` need the same formatting/validation logic, it belongs in `lib/` or `schemas/`, not copy-pasted.

---

## 6. Styling Standards

- Use the project's existing styling approach (Tailwind, CSS Modules, etc.) consistently — never mix approaches within the same component without a documented reason.
- Mobile-first responsive classes/queries from the start, not retrofitted later.
- Keep a consistent spacing/typography scale; avoid magic numbers (`mt-[13px]`) when a scale token already covers the case.
- Styling should be additive and themeable — avoid `!important`, deep selector overrides, or styles that fight the design system.

---

## 7. State & Data Handling

- Keep state as local as possible. Lift state up only when two siblings genuinely need to share it.
- Derive values from existing state/data instead of storing duplicate copies that can drift out of sync.
- Reach for global state (Context, Zustand, etc.) only when prop drilling becomes a real maintenance problem — not by default.
- Model async state as a discriminated union (`idle | loading | success | error`), not a pile of independent booleans.
- Memoize (`useMemo`, `useCallback`, `memo`) only when there's a measured or obviously real re-render/computation cost — not preemptively.
- Keep async logic (API calls, side effects) isolated in hooks/services so it can be tested without rendering a component tree.

---

## 8. Forms & Validation

- Use a typed form library (`react-hook-form`) paired with a `zod` resolver so form types, validation rules, and submitted payload types are derived from one schema.
- Validate on both client (UX) and server (Server Action / API route) — never trust client-side validation alone.
- Surface field-level errors accessibly (`aria-invalid`, `aria-describedby` linking to the error message).

---

## 9. API & Services Layer

- All external calls (REST, DB, third-party APIs) go through a `services/` layer with typed request/response contracts — components and routes never call `fetch` directly against a raw URL.
- Every service function has a typed return value and typed, narrow error handling (no swallowed `catch {}` blocks).
- Validate external responses with `zod` before trusting their shape, even from "trusted" internal APIs — schemas drift.

---

## 10. Quality Bar

- Code should be understandable in six months with zero extra explanation.
- No dead code, unused imports, unused props, or redundant logic.
- Every component/function explicitly handles its loading, empty, and error states — "it just works when everything goes right" is not acceptable.
- Prefer several small, named, testable functions over one large function with branching logic.
- When refactoring, preserve existing behavior unless the task explicitly asks for a behavior change — call out anything you're not 100% sure is behavior-preserving.

---

## 11. Testing & Reliability

- Add or update tests whenever behavior changes — no silent contract breaks.
- Prioritize coverage on: utility/business logic functions, critical user flows, and reusable UI primitives' edge cases (empty, error, loading, boundary props).
- Tests describe behavior, not implementation details (avoid shallow snapshot-only tests that break on every harmless refactor).
- Test names read as specifications: `"shows validation error when email is invalid"`, not `"test 3"`.

---

## 12. Security & Safety

- Never expose secrets, tokens, or credentials in code, logs, client bundles, or UI — double-check anything passed to a Client Component.
- Treat all external input (forms, query params, headers, third-party API responses) as untrusted until validated.
- Be deliberate about the SSR/CSR boundary: never assume `window`, `document`, or other browser-only APIs are available without a client-side guard.
- Sanitize/escape any user-generated content that gets rendered as HTML.

---

## 13. Performance

- Avoid unnecessary re-renders before reaching for memoization — first check component boundaries and prop stability.
- Use dynamic imports / code splitting for heavy, rarely-used, or below-the-fold components.
- Don't add a dependency for something a few lines of native code or an existing utility already solves.
- Don't optimize prematurely, but never ignore an obvious inefficiency (N+1 fetches, unbounded lists without virtualization, etc.) just because it "works."

---

## 14. AI Behavior Rules

- Before writing new code: read nearby files and match their conventions exactly (naming, file structure, import order, error handling style).
- Make the smallest correct change that satisfies the request — do not perform a drive-by refactor unless explicitly asked.
- If the codebase has inconsistent patterns, pick the one that best matches these instructions, apply it to the new code, and flag the inconsistency rather than silently "fixing" unrelated files.
- All generated UI must be typed, accessible, and production-ready — no `TODO`, no placeholder text, no fake data left behind.
- Never introduce a vague abstraction ("a generic helper just in case") without a concrete, current use case.

---

## 15. Shell & CLI Usage

- When running shell commands through the RTK proxy, always prefix commands with `rtk` (see the RTK block at the top of this file).
- Use raw/un-prefixed commands only when strictly necessary, and do so intentionally.
- Keep command output concise and relevant to the task at hand.

---

## 16. Priority Order

When standards conflict, resolve in this order:

1. Correctness and safety
2. Existing project conventions
3. TypeScript strictness and domain modeling quality
4. Component reusability and maintainability
5. Performance
6. Code style preferences
