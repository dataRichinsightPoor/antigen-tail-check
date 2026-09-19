# Antigen-tail Check

Are two expression-matched populations actually comparable? This research-use browser model compares empirical or synthetic antigen-expression distributions, calculates exact tail differences, and integrates an explicitly hypothetical shared response mapping.

Part of Data-Rich, Insight-Poor, 99 Small Problems. Useful models for assumptions with expensive ambitions.

## Run locally

The committed preview is prebuilt and requires no installation. After changing the calculation or worker code, run `npm run build` to regenerate its self-contained worker bundle. Serve the `web` directory with any static web server, for example:

```sh
python -m http.server 8080 --directory web
```

Open `http://localhost:8080`. Run the mathematical unit tests with `npm test` using a recent Node.js version.

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
