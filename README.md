# NEXORA — Advanced Mathematics & Calculation Workspace

**Calculate. Explore. Understand.**

NEXORA is a premium, production-quality calculator and mathematics workspace built entirely with vanilla HTML, CSS, and JavaScript. It satisfies the CodeAlpha calculator brief at its core — arithmetic, a real-time display, clear functionality, keyboard support, and a fully responsive UI — and then extends it into a broader personal mathematics workspace: scientific functions, graphing, equation solving, matrices, statistics, converters, a formula library, study mode, and a local rule-based math assistant.

## CodeAlpha Internship

- **Internship:** CodeAlpha Frontend Development Internship
- **Task:** Task 2 — Build a Calculator
- **Author:** Nilusha Madhuwanthi

The core implementation is HTML, CSS, and JavaScript, satisfying every non-negotiable requirement of the original brief: basic arithmetic, a calculator display, user input, clear functionality, real-time result display, and responsive design. Everything beyond that (scientific mode, graphing, matrices, etc.) is an additional enhancement layered on top of the same calculator core — it does not replace or obscure it. The Calculator page is always one click (or the `C` shortcut) away from the dashboard.

## Overview

NEXORA combines several mathematical tools behind one consistent design system:

- **Basic & Scientific Calculator** — arithmetic, parentheses, operator precedence, memory (M+/M-/MR/MC), ANS, percent, sign toggle, and a full scientific keypad (trig, inverse trig, logs, roots, powers, factorial, constants) with DEG/RAD switching.
- **Graphing** — a Canvas-based plotting workspace with pan, zoom (wheel/touch), reset, fullscreen, multiple simultaneous functions, and a live grid.
- **University Mathematics** — Algebra (simplify/expand/factor/evaluate), Calculus (symbolic differentiation via math.js, clearly-labeled numerical integration and limits), and Trigonometry.
- **Equation Solver** — linear equations, quadratics (with discriminant analysis), and 2×2 linear systems (Cramer's rule), each with full step-by-step working.
- **Matrix Calculator** — 2×2, 3×3, and 4×4 matrices: add, subtract, multiply, scalar multiply, transpose, determinant, inverse, trace, rank, and 2×2 eigenvalues.
- **Statistics & Probability** — mean, median, mode, variance, standard deviation, range, sum, count, plus factorial/permutation/combination/binomial probability.
- **Converters** — length, weight, temperature, area, volume, speed, time, data, energy, and pressure, with a one-tap swap.
- **Finance** — loan payments, compound interest, and percentage change/difference.
- **Formula Library** — a searchable, categorized reference with copy/save actions.
- **Study Mode** — step-by-step equation walkthroughs with a save-to-problems action.
- **NEXORA Math Assistant** — a **local, rule-based** assistant (keyword/regex intent detection over math.js) that solves equations, differentiates, evaluates expressions, and explains formulas. It is explicitly labeled as local and is not connected to any external AI service.
- **History & Favorites** — every calculation is saved locally with reuse/favorite/copy/delete actions; favorites span calculations, formulas, and tools.
- **Dashboard** — a real SaaS-style home screen with a time-based greeting, quick actions, insights drawn from actual local data (never fabricated), a weekly activity chart, recent calculations, and "continue where you left off."
- **Command Center** (`Ctrl/Cmd + K`) — keyboard-navigable command palette for jumping to any tool or toggling appearance.
- **Appearance System** — Light, Dark, and Eye Comfort themes, with System / Manual / Scheduled auto night mode and a dedicated Reduce Motion toggle that also respects `prefers-reduced-motion`.
- **Onboarding** — a 3-screen first-run experience plus an optional, non-AI "how do you calculate?" personalization step that only affects dashboard suggestions.
- **PWA** — installable, with an offline-capable application shell via a service worker.

## Screenshots

_Add screenshots of the Dashboard, Calculator, Graphing, and Matrix views here before publishing._

## Technology

- HTML5, CSS3 (custom properties, no framework), vanilla JavaScript (ES6+)
- [math.js](https://mathjs.org/) — safe expression parsing/evaluation and symbolic differentiation (no `eval()` anywhere in the codebase)
- [Lucide Icons](https://lucide.dev/) (static build) for a consistent icon system
- Google Fonts: Space Grotesk (headings) + Inter (body) + JetBrains Mono (expressions)
- LocalStorage for all persistence, via a single centralized, debounced `StorageService`
- Canvas API for graphing
- No React/Vue/Angular, no Bootstrap/Tailwind, no backend, no Firebase

## Architecture

The app is a single HTML shell (`index.html`) with one JavaScript module per concern, loaded as plain `<script>` tags (no bundler required — open `index.html` directly or serve the folder):

```
index.html            App shell markup: sidebar, topbar, onboarding, command center, view root
css/styles.css         Full design system: tokens, components, layout, responsive rules
js/storage.js          StorageService — centralized, debounced localStorage access
js/state.js             AppState — event-driven central state (history, favorites, settings…)
js/utils.js            Shared helpers (formatting, DOM helpers, clipboard, icons)
js/toast.js             Toast notifications (no browser alert() anywhere)
js/theme.js             Light / Dark / Eye Comfort + Auto Night Mode + Reduce Motion
js/onboarding.js        3-screen onboarding + first-run personalization
js/calculator.js        MathEngine (safe evaluation) + basic calculator controller
js/scientific.js        Calculator view: keypad rendering, tabs, keyboard shortcuts
js/graphing.js           Canvas graphing engine (pan/zoom/fullscreen)
js/equations.js         Equation Solver + University Mathematics (algebra/calculus/trig)
js/matrix.js            Matrix Calculator
js/statistics.js        Statistics & Probability
js/converters.js        Unit converters
js/finance.js            Finance utilities
js/formulas.js           Formula Library
js/study.js              Study Mode
js/assistant.js          NEXORA Math Assistant (local, rule-based)
js/history.js             History & Favorites views
js/dashboard.js          Dashboard
js/settings.js            Settings, import/export
js/commandcenter.js      Ctrl/Cmd+K command palette
js/router.js              Hash-based router
js/app.js                 App bootstrap
manifest.json / sw.js     PWA manifest and offline-capable service worker
```

Every mathematical operation is routed through math.js — **`eval()` is never used anywhere in this codebase.**

## LocalStorage

All state is namespaced under `nexora:` keys and managed by `StorageService`, which debounces writes (so rapid interactions don't hammer `localStorage`) and flushes on tab hide / unload. Persisted data includes: theme, eye comfort, night schedule, reduce-motion preference, calculation history, favorites, settings, memory, recent tools, saved formulas, saved problems, dashboard state, and onboarding completion. A full backup can be exported to `nexora-backup.json` and re-imported, with basic schema/version validation and a friendly error if the file can't be read.

## PWA

`manifest.json` and `sw.js` make NEXORA installable and cache the full application shell so the calculator keeps working offline once it has been opened at least once.

## Accessibility

Semantic HTML landmarks, a skip-to-content link, `aria-label`/`title` on every icon-only button, visible focus states, keyboard-operable navigation and modals, and `aria-live` regions on the calculator display and toasts. Reduced-motion is respected both automatically (`prefers-reduced-motion`) and via an explicit in-app toggle.

## Responsive Design

A sidebar + topbar desktop layout collapses to a bottom navigation bar and a slide-in drawer below 1024px, with layouts intentionally re-composed (not just shrunk) at each breakpoint down to small phones.

## Mathematical Computing Notes

- Differentiation is **exact/symbolic** (math.js `derivative`).
- Definite integration and limits are **numerical approximations** and are always labeled "Approximate result" — never presented as exact symbolic mathematics.
- Algebraic factoring covers common quadratic patterns; when a full factorization isn't available, a simplified form is shown instead of a wrong answer.

## How to Run

No build step or server is strictly required:

1. Clone or download this repository.
2. Open `index.html` directly in a modern browser, **or** serve the folder locally for full PWA/offline support, e.g.:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
3. Visit the served URL (or the opened file) and NEXORA loads directly into the onboarding flow on first run.

## Project Structure

See [Architecture](#architecture) above for the full file layout.

## License

Built for educational purposes as part of the CodeAlpha Frontend Development Internship.
