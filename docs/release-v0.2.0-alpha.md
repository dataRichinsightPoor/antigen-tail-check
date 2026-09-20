# Antigen-tail Check v0.2.0-alpha

Public research-use alpha adding paired-antigen, productive-delivery, and optional pharmacodynamic audits to the original expression-distribution model.

## Open the models

- [Productive delivery and PD](https://datarichinsightpoor.github.io/antigen-tail-check/productive-delivery.html)
- [Paired-antigen audit](https://datarichinsightpoor.github.io/antigen-tail-check/coexpression.html)
- [Single-antigen audit](https://datarichinsightpoor.github.io/antigen-tail-check/)

## What is included

- Exact paired-antigen quadrants, overlap bounds when only marginals are available, hypothetical response rules, and a mechanism-evidence panel.
- Four-compartment ADC transport with prescribed entry, recycling, productive processing, competing intact-lysosomal loss, payload escape, and separate payload losses.
- Processing-versus-loss sensitivity maps for steady arrival and finite-window AUC, with inspection and CSV/PNG/JSON exports.
- Seven synthetic delivery scenarios, including lower uptake with higher delivery, indistinguishable payload trajectories from different routes, and equal-AUC profiles with different timing.
- An opt-in fixed-pool engagement and recoverable-signal hypothesis. Shared parameters, no binding depletion, no transport feedback, and no efficacy interpretation.
- Endpoint accounting and sampled assay-clock ranking reversals; complete mathematical explanations and parameter-bearing exports.
- Pure calculation modules, regenerated worker bundles, and 99 numerical regression tests.

## Important boundaries

The examples are invented, not fitted therapeutic datasets. Equal AUC refers to the stated intracellular species and integration window; it does not mean equal dose or efficacy. Entry is not inferred from antigen expression. The downstream state is not viability, DNA damage counts, tumor response, or clinical benefit.

The repository release is v0.2.0-alpha. Component identifiers remain `coexpression-1`, `delivery-9` (historical component version `0.2.6-example`), and `pd-2`. The frozen v0.1.0-alpha tag is unchanged. The article, cover, and private editorial material are excluded.

## Mathematics and source

- [Transport mathematics](https://github.com/dataRichinsightPoor/antigen-tail-check/blob/v0.2.0-alpha/web/delivery-model.md)
- [PD mathematics](https://github.com/dataRichinsightPoor/antigen-tail-check/blob/v0.2.0-alpha/web/delivery-pd-math.md)
- [Tagged source](https://github.com/dataRichinsightPoor/antigen-tail-check/tree/v0.2.0-alpha)

Original software and documentation remain MIT licensed. Numerical checks are implementation checks, not biological validation.
