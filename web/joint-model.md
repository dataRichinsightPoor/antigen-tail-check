# Antigen-tail Check: paired-antigen mathematics

Version 0.2.0-alpha, calculation revision coexpression-1. This is a descriptive audit of supplied expression distributions, not a bispecific binding model, ADC efficacy predictor, clinical tool or assay-validation procedure.

## What the tool accepts

Paired mode requires nonnegative X and Y measurements from the same cell/event, with a CSV or TSV header `x,y` or `x,y,count`. Counts are exact positive integer multiplicities, not bin approximations or arbitrary weights. Separate marginal mode accepts four distributions: AX, AY, BX and BY. It never pairs those files by row, rank or sorting.

Zero is a valid measured value. Values at a cutoff are low: X ≤ tx and Y ≤ ty. A high value is strictly greater than its cutoff. Negatives, censored values, missing fields, nonfinite numbers and fractional counts are rejected rather than silently corrected.

The parser allows at most 100,000 rows and 5,000,000 UTF-8 bytes per input, measurements no greater than 10¹², individual counts no greater than 10⁹ and total multiplicity no greater than 10¹². The small text editor allows 20,000 characters; use local file import for larger datasets. No data are uploaded by this application.

## Paired empirical distribution

For paired observations (xi, yi) with exact multiplicities wi, total N = Σi wi:

```text
P̂(X ≤ tx, Y ≤ ty) = Σi wi · 1(xi ≤ tx and yi ≤ ty) / N
```

Four quadrant fractions sum to one:

```text
LL = P̂(X ≤ tx, Y ≤ ty)
HL = P̂(X > tx, Y ≤ ty)
LH = P̂(X ≤ tx, Y > ty)
HH = P̂(X > tx, Y > ty)

q = HH                       double-high
e = HL + LH + HH = 1 − LL     either-high
DQ = ½ Σc∈{LL,HL,LH,HH} |pc,B − pc,A|
```

DQ is total-variation distance between these four categories at these cutoffs. It is not total-variation distance between the full continuous joint distributions. DQ = 0 does not establish identical joint distributions or biological equivalence. All signed differences are B minus A.

Each axis is also compared independently using the maximum empirical CDF difference. Means or marginal CDF agreement do not establish joint agreement.

## What separate marginal distributions can establish

Let px = P̂(X > tx) and py = P̂(Y > ty). Without measured pairing, the sharp Fréchet bounds are:

```text
max(0, px + py − 1) ≤ q ≤ min(px, py)
max(px, py) ≤ e ≤ min(1, px + py)
max(0, 1 − px − py) ≤ LL ≤ min(1 − px, 1 − py)
```

The difference interval between independently unconstrained populations is:

```text
[lowerB − upperA, upperB − lowerA]
```

Bounds at different grid locations are pointwise feasible intervals. Choosing all lower or upper endpoints across the entire surface need not describe one realizable joint distribution. No unique joint scatterplot, covariance or quadrant distance is manufactured in this mode.

## Threshold sensitivity

The displayed 51 × 51 grid is evenly spaced in log(1 + cutoff), from zero to the larger of the observed maximum, selected cutoff or one for each axis. Every grid value is computed from exact supplied values and counts. Joint-density displays aggregate points into display bins only; this does not alter the numerical audit.

The two-dimensional cumulative-count algorithm uses exact row multiplicities with boundary searches, then prefix sums. There is no random sampling or smoothing in reported fractions. Grid resolution limits visual exploration, not the exact selected-cutoff calculation.

## Optional mathematical response scenarios

These scores are off by default and unavailable without paired data. The midpoints Kx and Ky are in their respective expression-axis units; they are not affinity constants, administered doses or calibrated efficacy thresholds.

```text
u(x) = x^hx / (Kx^hx + x^hx)
v(y) = y^hy / (Ky^hy + y^hy)

product score = Ê[u(X)v(Y)]
either-route score = Ê[u(X) + v(Y) − u(X)v(Y)]

independence product = Ê[u(X)] Ê[v(Y)]
covariance = Ê[u(X)v(Y)] − Ê[u(X)] Ê[v(Y)]
mean-only product = u(Ê[X]) v(Ê[Y])
```

Thus the product-score discrepancy from an independence assumption is exactly the transformed covariance; the corresponding either-route discrepancy has the opposite sign. Neither function is automatically assigned to a therapeutic format. A bispecific ADC is not necessarily an AND gate, and a biparatopic construct against one receptor does not create two independently measured antigens.

The full discrepancy from a mean-only product score separates into:

```text
Ê[uv] − u(Ê[X])v(Ê[Y])
  = Cov̂(u,v) + {Ê[u]Ê[v] − u(Ê[X])v(Ê[Y])}
```

The first term captures same-cell association for the chosen score transformations. The second captures nonlinear marginal-distribution effects beyond scoring the two means. Neither is a measured therapeutic contribution, and zero transformed covariance does not prove independence.

Pairing is not universally necessary for a response comparison. For an exactly additive map a(X) + b(Y), its population expectation is completely determined by the two marginals. A nonseparable interaction makes joint information potentially relevant; the actual response map must still be justified independently.

With half of A at (0,0) and half at (100000,100000), versus half of B at (0,100000) and half at (100000,0), both axes have identical marginal distributions. At cutoffs 10000, A has q = 0.5 and e = 0.5; B has q = 0 and e = 1. This is an invented counterexample, not therapeutic efficacy data.

## Measurement declarations

X in A and B must have compatible measurement scales, and likewise Y. X and Y need not use the same units. ABC, MESF and arbitrary fluorescence are not automatically interchangeable. User declarations document an assumption; this software does not independently validate calibration, gating, quantitative resolution or same-cell acquisition.

Empirical inputs require provenance notes. No confidence interval is calculated because event count is not biological replicate count, and this release does not model sampling design, batch effects, calibration uncertainty or censoring.

## Mechanism-evidence panel and schematics

Nine domains record a status, assay, context and note: exposure, engagement, uptake/routing, processing, active payload, susceptibility, transfer, response and host constraints. A user-reported measurement is not independent verification. Statuses never modify the numerical results or produce an aggregate confidence or efficacy score.

The pairing schematic illustrates a fixed synthetic counterexample. The mechanism schematic is a qualitative evidence map, not an executed reaction network. Arrows represent conceptual dependencies rather than fitted fluxes, rate constants or proof of productive delivery. Recycling and payload transfer remain separate from direct intracellular killing.

The accompanying [mechanistic modeling reading guide](mechanistic-modeling-reading-guide.md) distinguishes published dynamic models from this descriptive audit. Published trafficking, resistance and transport work motivates these distinctions, including [Hunter et al. (2020)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/), [Tomabechi et al. (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/) and [Cilliers et al. (2018)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/).

## Why this audit is useful

Its proposed use is to test a comparability assumption before assigning a response difference to a therapeutic mechanism. The output is valuable when it changes which population comparison is defensible, identifies a need for paired measurements, exposes cutoff dependence, or redirects a downstream question to a more informative assay.

The tool does not invent a new quadrant statistic or replace specialist cytometry analysis. Its contribution is making the assumptions, feasible bounds, score dependencies and evidence boundaries reproducible in one place. A negative audit result can be useful: if added joint information does not change the particular inference under study, retain the simpler analysis rather than claiming complexity as a result.

## Reproducibility and boundaries

The JSON report retains parsed original input rows, parameters, metadata, evidence notes, selected-cutoff calculations, all grid values, version and calculation revision. CSV exports all grid values with axis labels and units; spreadsheet formula-like text is escaped. Evidence notes and imported data are included in a downloaded JSON report: inspect it before sharing.

No imported data or evidence are persisted by the app between page loads. There is no model fitting, hidden clinical calibration, receptor geometry, spatial tumor simulation, drug pharmacokinetics, intracellular payload calculation or efficacy prediction in this release.
