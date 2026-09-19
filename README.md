# Antigen-tail Check

Are two expression-matched populations actually comparable? This research-use browser model compares empirical or synthetic antigen-expression distributions, calculates exact tail differences, and integrates an explicitly hypothetical shared response mapping.

Part of Data-Rich, Insight-Poor, 99 Small Problems. Useful models for assumptions with expensive ambitions.

## Source

[Public repository](https://github.com/dataRichinsightPoor/antigen-tail-check) · [Scientific model and mathematics](web/model.md) · [Numerical implementation](web/model.js)

## Public demo and release

Open [Antigen-tail Check on GitHub Pages](https://datarichinsightpoor.github.io/antigen-tail-check/). No installation or sign-in is required; the default view opens in dark mode with an explicitly synthetic equal-mean comparison.

Choose a synthetic case or expand **Population inputs & comparability** to enter your own values or import a local file. Confirm the measurement mapping and resolved range, record provenance for empirical inputs, set the expression cutoff and hypothetical Hill scenario, and select **Run comparison**. Download the full JSON report or CSV sweep to retain the calculation and its assumptions.

The [v0.1.0-alpha prerelease](https://github.com/dataRichinsightPoor/antigen-tail-check/releases/tag/v0.1.0-alpha) preserves a fixed source snapshot. The public demo follows `main`; its deployment workflow rebuilds the worker and requires all numerical tests to pass before publication. See [deployment and verification](docs/deployment.md) for maintenance, versioning and privacy boundaries.

## Run locally

The committed preview is prebuilt and requires no installation. After changing the calculation or worker code, run `npm run build` to regenerate its self-contained worker bundle. Serve the `web` directory with any static web server, for example:

```sh
python -m http.server 8080 --directory web
```

Open `http://localhost:8080`. Run the mathematical unit tests with `npm test` using Node.js 22 or later. No npm installation is required for the app, build or numerical tests.

GitHub Actions runs the numerical tests and checks that the committed worker bundle matches its source. The historical browser validation is recorded in [the validation receipt](tests/validation-receipt.md); it is not part of this CI workflow. `tests/browser-qa.js` is a development-harness script that requires a supplied Playwright page and error collector, not a standalone test command.

## Scientific documentation

Read `web/model.md` for definitions, derivations, published references, the worked example, input contract and empirical validation plan. The browser and Node tests use the same pure calculation module, `web/model.js`.

This is v0.1.0-alpha, a computationally tested preview, not a wet-lab-validated model. It is not a tumor response predictor, FCS processor, calibration converter, equivalence test or clinical tool.

## Files

- `web/index.html`, `web/style.css`, `web/app.js`: dark-default browser interface.
- `web/model.js`: shared numerical core and synthetic examples.
- `web/worker.js`: off-main-thread calculation and error reporting.
- `web/worker-source.js`: generated self-contained worker for sandboxed previews.
- `web/model.md`: scientific model, references and first-release specification.
- `tests/model.test.mjs`: analytic and property-based numerical checks.
- `tests/qa-inventory.md`: functional and visual acceptance inventory.

All numerical demonstrations are synthetic. The preview has no backend or persistent storage; entered observations remain in the browser. The external font service receives normal resource requests but no entered values.

## License

The original code and accompanying documentation are available under the [MIT License](LICENSE.md). Cited publications and externally served fonts remain subject to their respective rights and licenses; citing them does not relicense them.
