<div align="center">

# ⌘ Command Palette Studio

**A shortcut to something good.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-b7a484?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue command palette designer with custom hotkey directives, keyboard search, executable local actions, and standalone component export._

</div>

---

## ✨ Highlights

- **Command Editing:** Create up to 20 commands with titles, categories, search keywords, shortcuts, and local actions.
- **Keyboard Search:** Search by multiple words, navigate with arrows/Enter, and promote recently executed commands.
- **Executable Preview:** Try commands that add notes, change the preview theme, focus the scratchpad, or clear it.
- **Shortcut Validation:** Validate shortcut conflicts and suppress regular command shortcuts in editable fields.
- **Import & Component Export:** Import/export CP/1 settings and download a self-contained, runnable Vue SFC.
- **Local Workspace:** Validated device-local persistence and imports that preserve the current workspace on failure.
- **Project Identity:** Original favicon and social artwork, CodeSculptor attribution, and deterministic configuration stamps.

## 🧱 Project Structure

```text
public/
|-- favicon.svg                                   # Original project favicon
|-- og.svg                                        # Original social artwork
`-- sample-workspace.json                         # Complete importable sample
src/
|-- components/
|   |-- AppDialog.vue                             # Teleport native dialog and focus lifecycle
|   |-- AppIcon.vue                               # Inline SVG interface icons
|   `-- CommandPalette.vue                        # Modal search and keyboard selection
|-- composables/
|   `-- commands.ts                               # Typed command registry and local actions
|-- directives/
|   `-- hotkey.ts                                 # Shortcut listeners and directive lifecycle
|-- domain/
|   |-- export.ts                                 # Standalone command palette SFC generator
|   `-- palette.ts                                # CP/1 validation, search, and sample
|-- services/
|   |-- draft.ts                                  # Validated local draft persistence
|   `-- files.ts                                  # Downloads, cloning, and identity stamps
|-- App.vue                                       # Workspace, controls, and data exchange
|-- base.css                                      # Tailwind theme and native element defaults
|-- main.ts                                       # Vue application entry
`-- style.css                                     # Brand tokens and domain-specific styles
tests/
|-- e2e/
|   |-- exported-palette.spec.ts
|   `-- studio.spec.ts
`-- palette.test.ts
index.html                         # English metadata and application mount
package.json                       # Local dependencies and npm commands
playwright.config.ts               # Production browser workflows
vite.config.ts                     # Vue and Tailwind plugins
vercel.json                        # Explicit routes, caching, and headers
```

## 🛠️ Tech Stack

Vue 3, TypeScript 6, Vite 8, and Tailwind CSS 4. Locally bundled DM Sans and Bricolage Grotesque fonts. Prettier for formatting, Node's test runner for domain/export checks, and Playwright for production browser workflows. Dependencies are installed inside this project.

A custom directive owns hotkeys, typed provide/inject shares commands, and defineModel binds the Teleport modal.

## 🎨 Tailwind Styling

The application uses Tailwind CSS 4 utilities directly in Vue templates for layout, spacing, typography, borders, colors, and visible states. Responsive and selector variants preserve the existing desktop and narrow-screen layouts. Utility names are complete source strings that Tailwind can detect during the Vite build.

`src/base.css` defines the font and spacing theme, maps project colors through `@theme inline`, and uses `@apply` for native element defaults. `src/style.css` holds the original brand tokens and any remaining domain-specific rules. Dynamic classes express Vue states, while explicit `data-ui` attributes identify elements used by descendant utilities or browser tests. Unused class names are removed. The spacing unit is `4px` to preserve the original pixel measurements independently of the root font size.

The downloadable component deliberately includes its own CSS so it can run in another Vue app without this project theme.

## 📦 Included Demo Data

`public/sample-workspace.json` is a complete importable CP/1 sample. Defaults also live in the domain module, so startup does not depend on a fetch. Import uses the same validation as saved drafts and preserves your current workspace on failure. Unknown metadata is ignored; the parser reconstructs known fields and validates enums, identities, string lengths, and numeric limits.

The sample includes executable browser-local commands and their shortcuts. It restores the palette configuration; scratchpad text, recent commands, and action history remain session-only.

## 🚀 Local Development

Requires Node.js 24 or later.

```bash
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173`. To serve the production build:

```bash
npm run build
npm run preview
```

## ◈ Vue Implementation

A typed registry is provided by `provide` and read by the palette through `inject`. The custom `v-hotkey` directive registers window listeners, updates bindings, and removes listeners on unmount. The palette uses `defineModel`, computed search, `Teleport`, and a native modal dialog. The exported SFC includes its own directive, registry state, modal search, scratchpad, and scoped styles; it needs only Vue.

Vue reference: [official documentation](https://vuejs.org/guide/reusability/custom-directives.html).

## 💾 Local Drafts & Data Exchange

Valid edits save to localStorage on this device. Invalid edits preserve the last valid save; storage failures appear in the header on desktop. Corrupted saved data restores the sample. Restoring the sample uses a confirmation dialog. Export before clearing browser storage or switching devices.

## ◈ Project Markers

Exports identify `vue-command-palette-studio`, CodeSculptor, and a deterministic `CP-XXXXXXXX` checksum. The same configuration produces the same stamp; edits change it. This is an identity aid, not a cryptographic signature or a uniqueness guarantee. There are no tracking requests.

## 🔌 Extension Notes & Nuances

Actions affect the browser-local demonstration workspace. The exported component retains these actions; edit it to connect your own application behavior. Configuration persists, while scratchpad text, recent commands, and history stay in the session. The scratchpad is limited to 6,000 characters. Supported shortcuts are Mod+K, Alt+letter/digit, Alt+Shift+letter/digit, and Mod+Shift+letter/digit; Mod means Command or Control. Browser/OS shortcuts may take precedence. Regular actions ignore editable fields; the palette launcher remains available while typing. The native dialog supports Escape, focus trapping, and focus return. Text is interpolated and exported script data escapes `<`.

Editor and preview panels reserve space when selecting commands or changing the preview theme. Larger content scrolls inside its panel. The layout supports 320 px screens and reduced motion. Original visual assets are SVG; convert the social artwork to PNG for services that require a raster image.

## 🧪 Build & Checks

```bash
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit checks cover shortcut and identity validation, search ranking, supported modifiers, and generated SFC compilation with escaped script data. Browser checks exercise keyboard-selected actions, editable-field hotkey suppression, scratchpad focus, persistence, invalid imports, and narrow screens. The actual downloaded component runs in a separate Vue application, including a check that directive listeners are removed on unmount. Browser tests use the production build; test results and traces are Git-ignored.

## 🌐 Pages & Vercel Deployment

- `/` — application workspace
- `/sample-workspace.json` — importable CP/1 fixture

Import this directory as the Vercel project root. The explicit configuration uses the Vite preset, `npm ci`, `npm run build`, and `dist`. The custom development command forwards `$PORT` to Vite with `--strictPort`.

- `/` serves the app; `/index.html` permanently redirects to `/`.
- Trailing slashes are removed; there is no catch-all rewrite.
- HTML, sample JSON, icons, and social artwork require revalidation.
- Content-hashed JS, CSS, and fonts in `/assets/` receive a one-year immutable cache policy.
- Responses include `X-Content-Type-Options: nosniff` and a referrer policy.
- Static files retain their original paths. Missing files do not fall back to HTML.

Vite preview does not emulate Vercel routing or headers. Schema validation and local route evaluation cannot replace HTTP checks against an actual Vercel deployment.

## 📄 License

MIT License. See [LICENSE](./LICENSE).
