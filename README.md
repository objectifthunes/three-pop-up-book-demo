# three-pop-up-book-demo

Next.js (App Router, Turbopack) documentation site + live demo for
[`@objectifthunes/three-pop-up-book`](https://www.npmjs.com/package/@objectifthunes/three-pop-up-book) — 3D
pop-up elements that rise from the pages of a [three-book](https://github.com/objectifthunes/three-book) in
Three.js.

Live at https://objectifthunes.github.io/three-pop-up-book-demo/.

Every export is documented with source-paired examples, and the library's full studio (the three-book editor
plus a Pop-Ups tab) runs in the browser at `/full/editor/` (plus a minimal pop-up at `/full/minimal/`).

## Local dev

`@objectifthunes/*` are **private** npm packages, so you need read access. Authenticate once:

```bash
echo "//registry.npmjs.org/:_authToken=YOUR_NPM_TOKEN" >> ~/.npmrc
pnpm install
pnpm dev
```

Then open http://localhost:3000.

## Build / static export

```bash
pnpm build
```

`next build` runs with `output: 'export'` and emits a static site to `out/`. CI deploys that folder to GitHub
Pages.

## CI / deployment

`.github/workflows/pages.yml` builds and deploys to GitHub Pages on every push to `main`. Because the packages
are private, the workflow writes an npm auth line to `~/.npmrc` from the **`NPM_TOKEN`** repository secret before
installing.
