# Public demo deployment

The canonical public demo is [Antigen-tail Check on GitHub Pages](https://datarichinsightpoor.github.io/antigen-tail-check/). It is a static browser application, with no application server and no installation or sign-in requirement.

## Build and publication

GitHub Pages uses the GitHub Actions deployment mode. A push to `main`, or manual dispatch of `.github/workflows/pages.yml`, runs the `public-demo` workflow.

The build job runs `node scripts/build-worker.mjs` and `node --test tests/*.test.mjs` under Node.js 22. It regenerates all four worker bundles (single-antigen, paired-antigen, delivery, and PD). A generated-file diff check rejects an out-of-date committed bundle.

Only after those checks pass is `web/` uploaded as a Pages artifact. A separate deployment job receives `pages:write` and `id-token:write` permissions and publishes through the `github-pages` environment; private research, local QA artifacts and other projects are outside the uploaded directory.

## Maintenance

Run `npm test` after changes, inspect and commit the generated worker if its sources changed, and push the reviewed commit. The next successful workflow deploys the updated static files.

The separate numerical-validation workflow checks pushes and pull requests. Browser interaction testing is a distinct verification step; current CI does not establish browser coverage or biological validity.

## Live verification

Check the public URL, default dark mode, equal means of 50,000 and default tails of 0% / 20%. Change the cutoff to 60,000 and rerun to confirm 100% / 20%, then reset.

Exercise synthetic cases, empirical input safeguards, theme switching, file imports, and JSON/CSV exports. Verify the repository, release, rendered mathematics and local code/document downloads; inspect desktop and mobile layouts for overflow and check browser errors.

The existing [acceptance inventory](../tests/qa-inventory.md) and [computational validation receipt](../tests/validation-receipt.md) describe the broader checks and exclusions.

## Versioning

The `v0.1.0-alpha` tag freezes the initial tested implementation. The `v0.2.0-alpha` release adds the paired-antigen and delivery/PD companions. GitHub Pages follows `main`; a live page is not an immutable release artifact. The publication article, cover, and private editorial material are excluded from the public release.

Use the [tagged source](https://github.com/dataRichinsightPoor/antigen-tail-check/tree/v0.1.0-alpha) for a fixed reproduction target. Do not move published tags; substantive later model changes should receive a new version and release.

## Data and scientific boundaries

Input observations are processed locally in the browser. No analysis endpoint or persistent browser storage is implemented, but GitHub Pages and the external font provider receive normal web-resource requests.

Do not enter confidential information into example provenance fields. The MIT license concerns the original software and documentation, not the licensing of cited papers or external fonts, and neither deployment nor passing tests establishes biological validity or legal clearance.
