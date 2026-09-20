# Antigen-tail Check

Small, inspectable models for assumptions that can change an assay's interpretation. Part of **Data-Rich, Insight-Poor · 99 Small Problems · No. 02**: Useful models for assumptions with expensive ambitions.

## Try the models

- [ADC productive-delivery and pharmacodynamic model](https://datarichinsightpoor.github.io/antigen-tail-check/productive-delivery.html): prescribed entry, routing, processing, competing loss, payload escape, finite-window exposure, and an optional engagement/recovery hypothesis.
- [Paired-antigen audit](https://datarichinsightpoor.github.io/antigen-tail-check/coexpression.html): same-cell coexpression, exact quadrants, marginal-only bounds, and a mechanism-evidence panel.
- [Single-antigen distribution audit](https://datarichinsightpoor.github.io/antigen-tail-check/): empirical or synthetic distributions, antigen-low tails, and explicitly hypothetical response mappings.

All three run in the browser, open in dark mode, and require no installation. Demonstrations are synthetic; entered observations are processed locally without an analysis server or persistent storage. Hosting and external fonts still involve normal network requests. Do not enter confidential data.

## Reproduce the equal-AUC example

In the delivery model, load **Equal AUC, different time profiles**. Review the two-hour entry pulse and 24-hour window, then acknowledge the prescribed free-payload assumption before running the optional PD hypothesis.

The default synthetic cases have approximately equal 24-hour cytosolic AUC and nearly equal peak downstream signals, but a roughly 20.2-fold B/A endpoint-signal ratio. Compare **Slow engagement, same K** and **No signal recovery** without changing delivery inputs. Inspect absolute signals, peaks, the assay-clock audit, and residual exposure rather than interpreting a single ratio as efficacy.

Matching changes B's entry amplitude only. Equal finite-window AUC is not equal administered dose, lifetime exposure, target engagement, viability, or therapeutic benefit. Export JSON to preserve parameters and assumptions alongside CSV/PNG outputs.

## Code and mathematics

- **Transport:** [calculation code](web/delivery-model.js), [equations, units, assumptions and worked examples](web/delivery-model.md).
- **PD:** [engagement/recovery code](web/delivery-pd-model.js), [endpoint interpretation code](web/delivery-pd-audit.js), [mathematical derivations and conceptual references](web/delivery-pd-math.md).
- **Paired antigen:** [code](web/joint-model.js), [mathematics](web/joint-model.md).
- **Single antigen:** [code](web/model.js), [mathematics and references](web/model.md).
- **Scientific context:** [mechanistic-modeling reading guide](web/mechanistic-modeling-reading-guide.md).

The delivery model includes competing intact-lysosomal loss, separate released-payload losses, mass-balance checks, processing-versus-loss maps for steady arrival and finite-window AUC, pulse/chase inputs, profile normalization, and inspection/export controls. The optional PD layer shares its assumptions between A and B and does not feed back into payload transport.

These tools are deliberately not a single integrated therapeutic predictor. Antigen expression does not determine the prescribed entry flux. The maps are sensitivity calculations, not probability maps; input ranges are not evidence-based uncertainty distributions. The PD signal is arbitrary, not cell killing. Parameters are not fitted to a therapeutic construct, and passing numerical tests is not biological validation.

## Run and test locally

Node.js 22 or later is used in CI. No npm dependency installation is required for the app, worker build, or numerical tests.

```sh
node scripts/build-worker.mjs
node --test tests/*.test.mjs
python -m http.server 8080 --directory web
```

Open `http://localhost:8080/productive-delivery.html`. The generated worker bundles are committed so the static app also works directly after checkout. CI rebuilds and verifies all four bundles before deploying `web/` to GitHub Pages.

## Release and scope

**v0.2.0-alpha** publishes the paired-antigen and delivery/PD companions. Computational revisions remain separately identified as `coexpression-1`, `delivery-9`, and `pd-2`; the delivery component's historical `0.2.6-example` identifier is not the repository release version. The original [v0.1.0-alpha](https://github.com/dataRichinsightPoor/antigen-tail-check/releases/tag/v0.1.0-alpha) is unchanged.

See [release notes](docs/release-v0.2.0-alpha.md) and [deployment guidance](docs/deployment.md). GitHub Pages follows `main`; release tags provide fixed snapshots. The accompanying publication article, cover, and private editorial material are not included in this release.

## License

Original code and documentation are under the [MIT License](LICENSE.md). Cited publications and external fonts retain their own rights and licenses. No product-specific sequences, construct designs, proprietary assays, confidential observations, or fitted therapeutic parameter sets are supplied; this is not a clinical tool or a legal clearance.
