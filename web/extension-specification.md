# Antigen-tail Check: bispecific-focused extension specification

## Coexpression Check: Are the two targets on the same cells, and what would that actually change?

**Data-Rich, Insight-Poor · 99 Small Problems · No. 02**  
Useful models for assumptions with expensive ambitions.

Status: proposed extension; not implemented or experimentally validated.  
Specification revision: 1.1 · September 19, 2026.  
Proposed software version: `v0.2.0-alpha`.  
Baseline: the published `v0.1.0-alpha` remains unchanged.

The average cell is already a convenient fiction. Giving it two receptors does not make it more real. This extension asks whether two populations that match separately for antigen X and antigen Y also match in how those antigens occur together on individual cells. It then places that answer inside the delivery-to-killing system, rather than quietly promoting an expression measurement into an efficacy prediction.

The design has two layers: a bounded, executable coexpression audit for the next release, and a mechanistic specification for the additional measurements and separately validated models needed to connect recognition to response. Scientific depth belongs in the distinction between these layers, not in adding enough sliders to make uncertainty look adjustable. The proposed release does not predict bispecific ADC efficacy.

Current resources: [public demo](https://datarichinsightpoor.github.io/antigen-tail-check/) · [repository](https://github.com/dataRichinsightPoor/antigen-tail-check) · [frozen alpha release](https://github.com/dataRichinsightPoor/antigen-tail-check/releases/tag/v0.1.0-alpha) · [existing mathematics](https://github.com/dataRichinsightPoor/antigen-tail-check/blob/v0.1.0-alpha/web/model.md).

## Problem statement

The intended users are assay-development and translational scientists comparing cell populations, model systems, or assay preparations for a dual-target conjugate. The use case occurs whenever they need to decide whether an expression-matched comparison preserves the same-cell target combinations relevant to a proposed molecular mechanism. The frequency and financial cost of this problem have not been measured for this project; they are not invented here.

The mathematical failure is exact: identical marginal distributions do not identify an identical joint distribution. Two preparations can match every single-antigen distributional statistic while placing the two targets on entirely different cells. Separate histograms cannot recover the missing pairing.

The therapeutic motivation must remain format-specific. A published biparatopic HER2 ADC study linked a particular dual-epitope format to receptor clustering and altered trafficking, illustrating why receptor abundance alone does not characterize productive delivery ([Li et al., 2016](https://www.cell.com/cancer-cell/pdf/S1535-6108(15)00472-9.pdf)). Small-format conjugates introduce additional penetration–clearance tradeoffs, while non-internalizing, matrix-targeted conjugates demonstrate that extracellular payload release can depart from a tumor-cell internalization mechanism ([Deonarain et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698822/); [Dal Corso et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5844458/)).

These papers motivate boundaries, not interchangeable therapeutic equations. The release proposed here solves one smaller problem: **whether the supplied measurements identify same-cell target availability, and how that information changes declared mathematical scenarios.** The expanded specification defines where that information enters a larger causal model, which missing measurements could reverse its interpretation, and when a different small model is needed.

## Goals

- **Expose the hidden mismatch:** The canonical fixture must report identical X and Y marginals but different same-cell quadrant fractions, without presenting the preparations as biologically equivalent.
- **Preserve missing information:** Every marginal-only analysis must return sharp pointwise overlap bounds rather than an invented paired population or an independence-based point estimate.
- **Make assumptions inspectable:** Every hypothetical score must disclose its formula, parameters, input scale, dependence on pairing, and separation from measured outcomes.
- **Enable exact reproduction:** An exported JSON report must contain sufficient normalized input data and settings to reproduce every reported primary quantity within the specified numerical tolerance.
- **Preserve the existing tool:** All original single-antigen tests and user flows must pass unchanged before the extension ships.
- **Locate the inference boundary:** Every analysis must identify coexpression as an upstream measurement and distinguish it from engagement, productive delivery, intracellular pharmacology and observed response. A mechanism-evidence panel must expose missing links without calculating a spurious overall confidence or efficacy score.

## First-release non-goals

- **Predicting therapeutic response:** No cell-killing, survival, tumor-regression, therapeutic-index, or clinical efficacy prediction. Hypothetical scores are dimensionless mathematical outputs.
- **Modeling molecular engagement:** No affinity fitting, avidity estimation, cis/trans bridging calculation, binding geometry, receptor clustering, synapse formation, or format-engineering recommendation.
- **Executing delivery and disposition models:** No endocytosis, lysosomal release, exposure kinetics, tissue penetration, extracellular release, payload transfer, or PK simulation in `v0.2.0-alpha`. The mechanistic architecture below specifies how separate, evidence-supported modules could eventually address these questions; it is not an implemented simulator.
- **Repairing measurement data:** No raw-FCS processing, compensation, spectral unmixing, calibration conversion, censoring reconstruction, or conversion of negative compensated values into true zeros.
- **Establishing inferential equivalence:** No p-values, confidence intervals, biological-replicate pooling, or universal multivariate response bound. Agreement on a displayed grid is not biological equivalence.

## User stories

- **Assay scientist:** As an assay scientist, I want to compare paired X/Y observations from two preparations so that apparently matched marginal expression does not conceal different same-cell combinations.
- **Scientist with incomplete measurements:** As a scientist with separate X and Y distributions, I want the feasible range of double-positive and either-positive fractions so that I can decide whether a paired measurement is necessary.
- **Format evaluator:** As a scientist considering alternative recognition strategies, I want to compare declared joint-requirement and either-route score functions without treating either function as the mechanism of my molecule.
- **Measurement specialist:** As a cytometry specialist, I want comparisons blocked when corresponding axes or gates are incompatible, while permitting different scales for X and Y when each axis is consistently measured across preparations.
- **Reviewer:** As a reviewer, I want the original multiplicities, measurement declarations, formulas, parameters, and software revision in the report so that I can reconstruct the conclusion and identify unsupported inferences.

## Requirements and acceptance criteria

Priority definitions: P0 is required to ship; P1 is a defined follow-up; P2 is optional. No P1 or P2 feature may weaken a P0 scientific safeguard.

### P0: explicit analysis modes

Provide three separate entry points: the unchanged single-antigen audit, a paired two-antigen audit, and marginal-only overlap bounds. The two-antigen module is an extension of No. 02, not a renumbered publication or a new claim that the existing alpha already supports joint measurements.

Given paired mode, when a user supplies two compatible paired populations, then calculate their joint quantities. Given marginal-only mode, when four marginal inputs are supplied, then calculate marginal summaries and feasible overlap intervals, but do not calculate a measured joint distribution or paired response score. Dependencies: new parsers, mode-specific validation, and report schema.

### P0: same-cell pairing is a data contract

Require explicit confirmation that X and Y in each row originate from the same cell/event, or that a counted row represents an exact observed X/Y pair. Independently acquired files must never be joined by row number, rank, sorting, equal event count, or random assignment.

Given a missing pairing declaration, when paired analysis is requested, then block calculation and explain the missing information. Synthetic examples may declare constructed pairing, but empirical imports must clear previous attestations. Dependencies: provenance interface and parser separation.

### P0: exact quadrant calculations

For chosen cutoffs, report the four quadrant fractions, the double-high fraction, the either-high fraction, and signed differences defined consistently as Population B minus Population A. Report all descriptive fractions as properties of the supplied data, not susceptible-cell fractions.

Given tied values at a cutoff, when quadrant membership is evaluated, then assign equality to the low side. Given any valid input, when fractions are summed, then the four quadrants must total one within tolerance. Dependencies: weighted paired representation and shared threshold convention.

### P0: marginal-only bounds

Return sharp pointwise Fréchet bounds for double-high and either-high fractions, and feasible difference intervals between preparations. An interval containing zero means that the supplied marginals do not determine the sign of the difference; it is not evidence of equality.

Given the canonical 50%-high marginals, when overlap is requested, then report double-high in `[0, 0.5]` and either-high in `[0.5, 1]`. Do not substitute the independence value `0.25`. Dependencies: weighted marginal calculations and bound arithmetic.

### P0: deliberate, optional score scenarios

Scenarios are off by default. Paired mode may enable two dimensionless maps: a product map and an either-route map, defined below. Display both as hypothetical scores, not internalization, payload exposure, response probability, or killing.

Given a user enabling scenarios, when parameters change, then recalculate using each observed pair and display the chosen formula, midpoint units, slopes, marginal-independence comparator, and mean-only comparator. Given marginal-only mode, then paired scores remain unavailable. Dependencies: stable Hill evaluation and explicit opt-in.

### P0: measurement and provenance safeguards

Compare X in A against X in B, and Y in A against Y in B. X and Y need not share a unit; their corresponding axes across populations must have compatible declared scales and measurement mappings.

Given X measured in ABC and Y in MESF, when each axis is compatible across A and B and all other declarations are satisfied, then allow analysis. Given X in ABC for A but relative fluorescence for B, then block until valid external harmonization is documented and harmonized values supplied. Dependencies: per-axis metadata; no in-tool conversion.

Require empirical provenance, shared or validated-compatible gates, quantitative resolution in the compared ranges, and valid simultaneous measurement. Include a warning that paired staining does not by itself prove therapeutic co-engagement or demonstrate absence of detection-reagent interference.

### P0: joint-threshold map

Display a 51 × 51 threshold grid of exact hard-quadrant fractions evaluated at those selected nodes. Provide views for A, B, and B minus A, with a clear choice between double-high, either-high, or double-low.

Given a grid node, when its numerical value is inspected or exported, then it must agree with the exact quadrant routine at those cutoffs. The maximum displayed absolute difference must be labeled “largest difference on this grid,” never a global two-dimensional distance. Dependencies: cumulative-count grid algorithm and export metadata.

### P0: safe local operation and exports

Preserve dark-default design, background execution, bounded editors, local file import, cancellation, stale-result suppression, and no persistent storage. Export JSON with full reproducibility metadata and CSV with the selected hard-threshold grid.

Given any analytical edit during calculation, when a prior worker returns, then its obsolete result must not appear or become downloadable. Given invalid input, then no previous valid result may remain presented as the current analysis. Dependencies: request identifiers, worker cancellation, and schema-aware rendering.

### P0: mechanism-evidence panel

Show the delivery-to-killing sequence next to the coexpression results, with coexpression explicitly highlighted as the step analyzed. For each additional step, allow `not supplied`, `user-reported measurement`, `assumption`, or `outside this model`, accompanied by an optional assay description, experimental context and evidence note. “User-reported measurement” is a provenance category, not verification by the software.

The steps are local exposure; accessible engagement; uptake and recycling; productive processing; active intracellular payload; payload susceptibility; spatial transfer; and time-dependent response. Include a separate host-exposure/toxicity boundary for translational interpretation. Users may leave all additional steps `not supplied`; the coexpression audit remains usable.

Given identical expression inputs and different mechanism notes, when analysis runs, then all numerical coexpression outputs must remain identical while exports preserve the different notes. Given every step marked measured, then the interface must still not generate an efficacy prediction or an aggregate evidence score. Dependencies: structured metadata, boundary-panel rendering and export round-trip tests.

### P1: later additions

- **Sensitivity around declared score parameters:** One-dimensional midpoint or slope sweeps with explicit scenario labels, after the primary implementation is validated. Smooth two-dimensional score heatmaps are not part of P0.
- **Replicate-preserving views:** Separate summaries for independently identified biological preparations without automatic pooling or inferential equivalence claims.
- **Optional dependence illustrations:** User-invoked hypothetical couplings for education, never displayed as reconstructed measurements.

### P2: optional conveniences

Support downloadable SVG/PNG scientific figures and saved local configuration files. These are convenience features, not substitutes for numerical provenance; persistent browser storage remains excluded unless explicitly approved later.

## Success metrics

The release gates below are prospective targets, not achieved results. No usage telemetry is proposed; user-level evaluation should use consenting, nonconfidential test sessions.

- **Numerical correctness:** All analytic fixtures, parser tests, invariance checks, export round-trips, and original alpha regressions pass before release. No known failing P0 test is acceptable.
- **Interpretation:** In a small usability check with five relevant scientists, all five must distinguish marginal-only bounds from measured paired fractions, and at least four must correctly explain why the canonical populations differ. This is a usability gate, not a powered validation study.
- **Task completion:** At least four of those five should complete a paired import and export without assistance after reading the built-in instructions. Record the baseline completion time first; do not claim improvement over the alpha because the alpha does not perform this task.
- **Runtime:** A comparison of 100,000 rows per paired population, including the hard grid, should finish within 5 seconds on a documented reference desktop; cancellation should visibly acknowledge within 250 ms. These are provisional engineering targets requiring measurement, not hardware-independent promises.
- **Safety:** Zero stale reports, fabricated pairings, silent row deletions, or scenario-to-efficacy labeling errors across the acceptance inventory.

## Open questions and proposed decisions

- **Product/scientific owner, non-blocking:** Keep “Coexpression Check” as a mode within Antigen-tail Check rather than a separate repository. This is the recommended default.
- **Measurement owner, blocking for empirical claims:** Decide whether the intended simultaneous X/Y assay has demonstrated compatible staining and detection behavior. Synthetic computational release can proceed without that evidence, but empirical validation cannot.
- **Scientific owner, blocking for functional interpretation:** Define the actual endpoint and exposure context before using a score as an experimental hypothesis. No default therapeutic interpretation is authorized by this specification.
- **Scientific owner, blocking for any mechanistic simulation:** Select one delivery route and one payload pharmacology, define independently measurable states, and demonstrate parameter identifiability before authorizing a fitted module. A universal bispecific-ADC simulator is not the default next milestone.
- **Engineering owner, blocking for release:** Benchmark the proposed input limits and grid algorithm on desktop and mobile, documenting device, browser, dataset and timing.
- **Scientific/IP reviewer, blocking for new public scientific examples:** Screen any additional papers or real datasets before inclusion. The first implementation uses generic X/Y labels and synthetic observations only.

## Mathematical contract

### Population notation and weights

Use `A` and `B` for the two populations and `X` and `Y` for the two antigen axes. This avoids confusing population identity with antigen identity.

For population \(j\in\{A,B\}\), let a row be

\[
(x_{ji},y_{ji},n_{ji}),\qquad
x_{ji},y_{ji}\ge 0,\quad n_{ji}\in\mathbb N_{>0}.
\]

Define

\[
N_j=\sum_i n_{ji},\qquad w_{ji}=n_{ji}/N_j,\qquad
\widehat P_j=\sum_i w_{ji}\delta_{(x_{ji},y_{ji})}.
\]

Merge only identical coordinate pairs. Never merge by X alone, by Y alone, or by a plotting bin. Marginal summaries use the induced weighted marginal distributions and preserve the existing inclusive empirical-CDF convention.

Counts represent observed event multiplicities, not biological replicates. The core distribution may be computationally exact for those inputs while the input observations remain subject to measurement error and sampling variation.

### Cutoffs and quadrant fractions

Define “low” as \(X\le\tau_X\) and “high” as \(X>\tau_X\), and likewise for Y. These are operational measurement cutoffs, not inferred receptor-occupancy or functional thresholds.

\[
\begin{aligned}
p_{LL,j}&=\sum_iw_{ji}\mathbf1[x_{ji}\le\tau_X,\ y_{ji}\le\tau_Y],\\
p_{HL,j}&=\sum_iw_{ji}\mathbf1[x_{ji}>\tau_X,\ y_{ji}\le\tau_Y],\\
p_{LH,j}&=\sum_iw_{ji}\mathbf1[x_{ji}\le\tau_X,\ y_{ji}>\tau_Y],\\
p_{HH,j}&=\sum_iw_{ji}\mathbf1[x_{ji}>\tau_X,\ y_{ji}>\tau_Y].
\end{aligned}
\]

The first letter always refers to X. Require

\[
p_{LL,j}+p_{HL,j}+p_{LH,j}+p_{HH,j}=1.
\]

The descriptive double-high and either-high fractions are

\[
q_j=p_{HH,j},\qquad e_j=1-p_{LL,j}.
\]

Signed differences are \(\Delta q=q_B-q_A\) and \(\Delta e=e_B-e_A\). The interface should say “both above cutoffs” and “at least one above cutoffs,” not automatically “AND-gated cells” or “OR-gated cells.”

### Marginal-only identifiability

Let \(p_{X,j}=\Pr_j(X>\tau_X)\) and \(p_{Y,j}=\Pr_j(Y>\tau_Y)\). Without pairing:

\[
L_j=\max(0,p_{X,j}+p_{Y,j}-1)
\le q_j\le
U_j=\min(p_{X,j},p_{Y,j}).
\]

These bounds follow because the intersection cannot exceed either set and the union cannot exceed one. They are sharp over all joint probability distributions with the specified marginal probabilities; they are not finite-sample confidence intervals.

Because \(e_j=p_{X,j}+p_{Y,j}-q_j\),

\[
\max(p_{X,j},p_{Y,j})
\le e_j\le
\min(1,p_{X,j}+p_{Y,j}).
\]

For independently unspecified pairings in populations A and B:

\[
\Delta q\in[L_B-U_A,\ U_B-L_A].
\]

Use the same interval subtraction for either-high bounds. Do not label the width an estimate of experimental error; it measures non-identifiability from the supplied marginals.

Bounds apply pointwise at each cutoff pair. An arbitrary collection of choices inside all displayed intervals need not correspond to one globally coherent joint distribution. Do not fit a joint surface by independently choosing a value inside each interval.

If X and Y were acquired from different event samples, their event counts may differ. Normalize each empirical marginal separately; do not equalize event counts by discarding, duplicating or pairing observations.

### Optional hypothetical score maps

Separate operational cutoffs \(\tau_X,\tau_Y\) from score midpoints \(K_X,K_Y\). A positivity gate must not silently determine the half-score parameter.

Define

\[
u(x)=\frac{x^{h_X}}{x^{h_X}+K_X^{h_X}},\qquad
v(y)=\frac{y^{h_Y}}{y^{h_Y}+K_Y^{h_Y}},
\]

where \(K_X,K_Y>0\) have the units of their own axes and \(h_X,h_Y>0\) are dimensionless. Evaluate with stable log-ratio arithmetic and define \(u(0)=v(0)=0\).

The two allowed P0 maps are

\[
g_{\mathrm{joint}}(x,y)=u(x)v(y),
\]

\[
g_{\mathrm{either}}(x,y)=1-[1-u(x)][1-v(y)].
\]

Both maps lie in \([0,1]\). The product map is a mathematical joint-requirement scenario; the either-route map is a saturating combination of two scores. Neither establishes receptor occupancy, simultaneous binding, molecular cooperativity, independence of biological pathways, or the mechanism of a specific ADC.

For paired inputs, compute

\[
\bar g_{j,s}=\sum_iw_{ji}g_s(x_{ji},y_{ji}).
\]

The primary label is “mean hypothetical score.” Do not relabel \(1-\bar g\) as a surviving or inaccessible fraction.

The marginal-independence comparator is

\[
g^{\mathrm{ind}}_{j,\mathrm{joint}}=\bar u_j\bar v_j,\qquad
g^{\mathrm{ind}}_{j,\mathrm{either}}=\bar u_j+\bar v_j-\bar u_j\bar v_j.
\]

Its paired-data deviation is exactly

\[
\bar g_{j,\mathrm{joint}}-g^{\mathrm{ind}}_{j,\mathrm{joint}}
=\operatorname{Cov}_j(u,v),
\]

\[
\bar g_{j,\mathrm{either}}-g^{\mathrm{ind}}_{j,\mathrm{either}}
=-\operatorname{Cov}_j(u,v).
\]

This makes the cost of ignoring pairing inspectable without randomly shuffling data. Independence describes a hypothetical coupling between measured antigen values, not a conclusion about cellular biology.

Also display \(g_s(\bar x_j,\bar y_j)\) as a separate mean-only comparator. It is distinct from the marginal-independence comparator and should not share its label.

Exposure concentration, incubation time and format description may be recorded as context, but P0 does not accept them as numerical model parameters. The score contains no dose or time dependence.

### A limited joint comparison bound

At the selected cutoffs, define the four-category distance

\[
D_Q=\frac12\sum_{r\in\{LL,HL,LH,HH\}}
|p_{r,A}-p_{r,B}|.
\]

For any shared score that is constant within each quadrant, with quadrant values \(c_r\in[0,1]\),

\[
\left|\sum_r c_rp_{r,A}-\sum_r c_rp_{r,B}\right|\le D_Q.
\]

To see this, write the signed quadrant differences as \(d_r\), whose sum is zero. Their total positive mass and total negative magnitude both equal \(D_Q\); choosing bounded coefficients cannot create a larger absolute sum.

This is a bound for a specified four-category representation only. It does not bound arbitrary functions of the continuous paired values, and specifically does not automatically bound the smooth score maps above. Two populations may have the same quadrant fractions but different within-quadrant expression and therefore different smooth scores.

Do not transplant the existing one-dimensional CDF bound to a bivariate CDF distance. This release also makes no general multivariate stochastic-dominance claim.

## Canonical examples and exact acceptance fixtures

All numbers below are invented. They are numerical acceptance fixtures, not therapeutic parameter estimates.

### Matched marginals, opposite pairing

Population A:

```csv
x,y,count
0,0,500
100000,100000,500
```

Population B:

```csv
x,y,count
0,100000,500
100000,0,500
```

Both populations have X mean 50,000 and Y mean 50,000. Their X marginals and Y marginals are identical, so both single-axis empirical CDF distances equal zero.

At \(\tau_X=\tau_Y=10{,}000\):

- **A:** `LL = 0.5`, `HL = 0`, `LH = 0`, `HH = 0.5`.
- **B:** `LL = 0`, `HL = 0.5`, `LH = 0.5`, `HH = 0`.
- **Double-high:** A = 0.5, B = 0, B minus A = −0.5.
- **Either-high:** A = 0.5, B = 1, B minus A = +0.5.
- **Four-category distance:** \(D_Q=1\).
- **Marginal-only mode:** Each population has double-high bounds `[0, 0.5]`, either-high bounds `[0.5, 1]`, and between-population difference bounds `[-0.5, 0.5]` for both quantities.

With independently selected score parameters \(K_X=K_Y=10{,}000\) and \(h_X=h_Y=2\), the high-value score is \(100/101\):

- **A joint score:** \(5000/10201=0.490148024703\).
- **B joint score:** \(0\).
- **A either score:** \(5100/10201=0.499950985198\).
- **B either score:** \(100/101=0.990099009901\).
- **Independence joint comparator, both populations:** \(2500/10201=0.245074012352\).
- **Independence either comparator, both populations:** \(7600/10201=0.745024997549\).
- **Mean-only joint comparator, both populations:** \(625/676=0.924556213018\).
- **Mean-only either comparator, both populations:** \(675/676=0.998520710059\).

The score differences result from an assumed function applied to known synthetic pairing. They are not a claim that a bispecific ADC will deliver or kill according to that function.

### Equality at the cutoffs

Given one population with equally weighted pairs `(0,0)`, `(10,10)`, `(10,11)`, `(11,10)` and `(11,11)`, when both cutoffs equal 10, then require `LL = 0.4`, `LH = 0.2`, `HL = 0.2`, `HH = 0.2`, and either-high = 0.6.

When a Hill input equals its positive midpoint, its score is exactly 0.5. Increasing slope does not make such an atom an inclusive-low or strict-high observation; the smooth and hard calculations must remain separate.

### Same quadrant, different score

Given A concentrated at `(20000,20000)` and B at `(100000,100000)`, when both cutoffs are 10,000, then \(D_Q=0\). With both score midpoints 10,000 and both slopes 2, the joint scores are 0.64 and \(10000/10201\), respectively; the interface must not claim the zero quadrant distance bounds their smooth-score difference.

### Zeros, one absent target, and invariance

Given all-zero observations, then both positive-cutoff high fractions and both hypothetical scores are zero; zero-mean CV is undefined, not zero. Given Y identically zero and X arbitrary, then the joint score is zero and the either score reduces exactly to the X score.

Given a permutation of rows, splitting or merging exact duplicate pairs, or multiplication of all counts in a population by the same allowed positive integer, then all normalized results remain unchanged. Given a positive rescaling of X together with its cutoff and midpoint, then results remain unchanged while Y remains untouched.

### Required numerical test suite

In addition to those fixtures, test population-swap sign reversal, axis-swap consistency, interval containment for actual paired fractions, probability bounds, covariance identities, valid count extremes, invalid and censored input rejection, grid-node equality with brute force, JSON round-tripping, and generated-worker agreement with the pure core.

Use absolute tolerance \(10^{-12}\) for normalized probabilities and bounded scores, plus relative tolerance \(10^{-10}\) for nonzero dimensional summaries. Compare null/undefined metadata explicitly rather than coercing it to zero. Test tolerances against large weighted inputs before release.

## Input, output and implementation contract

### Paired input

Accept UTF-8 CSV or TSV with mandatory `x,y` or `x,y,count` headers, in that order. Each row is one paired event or an exact coordinate-pair multiplicity. P0 rejects extra columns rather than guessing whether a column is an event identifier, replicate, or another marker.

Limits per population: 100,000 data rows, 5 MB file size, coordinates from 0 through \(10^{12}\), integer row counts from 1 through \(10^9\), and represented total count no greater than \(10^{12}\). Editors retain a 20,000-character limit; large inputs use files. Limits are engineering safeguards, not biologically plausible ranges.

Ignore blank lines and support scientific notation. Reject missing coordinates, nonfinite values, negative values, inequalities such as `<100`, noninteger counts, unknown headers, thousands separators, and inconsistent delimiters. Report the input name and physical line number; never silently discard a failing row.

Cutoffs may range from 0 through \(10^{12}\). Score midpoints must range from \(10^{-6}\) through \(10^{12}\); slopes range from 0.1 through 20. Zero-expression observations require no pseudocount.

### Marginal-only input

Supply A-X, A-Y, B-X and B-Y separately using the existing one-dimensional value/count parser. Explain that “matching row counts” does not mean “paired cells.” The same per-input limits apply, with a total import cap of 20 MB across the four files.

Metadata must state whether marginal measurements describe the same intended population definition and biological condition. If that cannot be affirmed, cross-axis overlap bounds are also not justified as a description of one population, and analysis must be blocked.

### Measurement metadata

Record target labels; scale and unit for each axis; per-population provenance; pairing status; staining and gating notes; resolution declarations; optional replicate identifier; and optional dose, exposure-time and format context as non-model metadata. Record the mechanism-evidence panel as structured status, context and note fields; none may alter the expression calculations.

Require compatible X mappings across populations and compatible Y mappings across populations. Do not calculate an X:Y receptor ratio from ABC versus MESF or other incomparable axis scales. P0 provides no receptor-ratio output even when units happen to match.

Record any background subtraction or external preprocessing in notes. A requirement for nonnegative resolved inputs must never become advice to clip negative compensated events to zero; such an input lies outside this release.

### Proposed module structure

Preserve `web/model.js` and the original single-antigen interface contract. Add a pure `web/joint-model.js` for paired parsing, marginal projection, quadrants, bounds, score integration and hard-grid computation, with corresponding tests.

Extend the worker protocol to distinguish `single`, `paired` and `marginal_bounds` jobs. Rebuild the self-contained worker bundle from the source modules, and test the bundled worker against direct module outputs. Dispatch exports by explicit report schema, not by guessing which fields happen to exist.

P0 calculation should be \(O(N)\) for a selected cutoff pair and score pair, plus sorting where needed for marginal summaries. For a hard 51 × 51 threshold grid, use exact cumulative bin counts or an equivalent sweep algorithm: an observation contributes according to the first selected cutoff greater than or equal to its coordinate, preserving inclusive ties.

Do not scan 200,000 rows independently for every grid node, and do not replace exact input values with visual-bin centers. A display-density map may aggregate for rendering, but those aggregates must not feed scientific calculations.

### JSON and CSV

Proposed report schema identifier: `antigen-tail-check/0.2`; software version: `0.2.0-alpha`. Include mode, calculation revision/commit, generation timestamp, dataset labels, normalized observations with original integer multiplicities, per-axis metadata, declarations, cutoffs, optional score settings, exact primary outputs, grid coordinates and results, mechanism-evidence metadata, warnings, and explicit limitations.

In marginal mode, mark joint quantities `not_identified_from_marginals` and include their bounds. In paired mode with scenarios disabled, mark scores `not_requested`. Use `null` plus a reason where necessary; do not export `NaN`, an invented zero, or ambiguous missing fields.

CSV exports must contain `mode`, `cutoff_x`, `cutoff_y`, units, and either paired quadrant fractions and signed differences or marginal-only lower/upper bounds. Include score parameters only in a separate score-summary export or clearly identified report section; positivity cutoffs and score midpoints must never share a column.

All user labels and notes must be HTML-escaped in the interface and safely encoded in downloads. Prevent spreadsheet formula execution from text cells beginning with formula-trigger characters. Raw observations are sensitive even when stored only locally, so exports should carry a clear reminder that they include user-supplied data.

## Dark-mode interface and scientific language

Retain the existing visual identity. The paired-mode headline for the canonical example should read: **“Matched marginals. Different same-cell combinations.”** Its subtext should explain that the difference concerns observed coexpression, not demonstrated co-engagement or killing.

Use a side-by-side joint-density display with explicit X/Y units, visible cutoffs, four quadrant fractions, and a numerical table. Color must not be the only distinguishing cue; use population labels, borders, line styles, and signed numerical differences.

Place evidence before assumptions: input status, measurement declarations, marginal agreement, joint quantities, then optional scores. In marginal mode, replace the joint-density plot with overlap intervals and a prominent explanation that pairing was not measured. Do not render a synthetic scatterplot that resembles recovered experimental data.

Present the mechanism-evidence panel as a compact, expandable sequence, not a dashboard of arbitrary percentages. Highlight the measured coexpression step; label unmeasured steps in text rather than using warning colors that imply biological failure. Include a persistent sentence: “This analysis compares target distributions. It does not establish productive delivery or cell killing.”

Threshold maps need a numerical readout and downloadable grid, not hover-only information. Any log-like display transform must be labeled as display-only; data, means, cutoffs and scores remain on the supplied linear scales.

Invalid, unresolved, or incompatible inputs block analysis with a reason and an appropriate next action. Switching mode or importing a file clears relevant declarations and invalidates old results. A changed target label or provenance field also invalidates exports so that stale scientific metadata cannot accompany a current calculation.

## How ADC format changes interpretation

The scope of the proposed module is two-target same-cell availability. A format-selection dropdown must not secretly assign a therapeutic mechanism or populate “literature-derived” response parameters.

- **Dual-target coverage hypothesis:** Examine either-high fractions and, optionally, the either-route score. This tests a declared mathematical hypothesis that either route contributes; it does not establish that either arm independently supports productive uptake.
- **Dual-target co-engagement hypothesis:** Examine double-high fractions and, optionally, the product score. Same-cell coexpression is necessary for the stated same-cell two-target hypothesis but insufficient to demonstrate spatial proximity, epitope accessibility, simultaneous engagement or productive trafficking.
- **Biparatopic, same-receptor formats:** Do not treat two binding epitopes as independent antigen-expression axes by default. The published HER2 example motivates geometry and trafficking measurements, not a second expression column with an invented receptor count ([Li et al., 2016](https://www.cell.com/cancer-cell/pdf/S1535-6108(15)00472-9.pdf)).
- **Small-format conjugates:** Retain the coexpression audit where relevant, but do not infer in vivo exposure from a static expression map; penetration and clearance can change in opposing directions ([Deonarain et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698822/)).
- **Matrix-targeted or extracellular-release conjugates:** Warn that tumor-cell expression may not define payload-recipient eligibility. Such formats require a separate spatial delivery model rather than relabeling joint-tail fractions as inaccessible cells ([Dal Corso et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5844458/)).

Dose-normalization metadata should distinguish molar conjugate concentration, mass concentration, and nominal payload-equivalent concentration when comparing formats. Nominal payload equivalents may be described as conjugate molarity multiplied by mean DAR, but neither that arithmetic nor equal binding establishes equal released intracellular payload; no such delivery calculation is implemented here.

### Bispecific hypotheses must have different falsification tests

Do not treat the following proposed mechanisms as interchangeable advantages of “two targets.” The tool should help the user state which hypothesis is actually being tested, while leaving unmeasured mechanisms unresolved.

- **Broader coverage:** Either arm is proposed to support productive delivery independently. Compare X-only, Y-only, double-high and double-low preparations with matched downstream susceptibility where feasible; failure of one single-target group to generate active payload challenges the either-route interpretation even if it binds conjugate.
- **Same-cell cooperative capture:** Simultaneous availability is proposed to improve a specified engagement or retention endpoint. Vary pairing while preserving marginal expression and measure that endpoint directly; a difference in final viability alone does not localize the mechanism to co-engagement.
- **Target-assisted processing:** One recognition route is proposed to redirect a captured molecule toward productive processing. Compare uptake, recycling, processing and active-payload generation under matched exposure; increased intracellular accumulation without increased active species does not support the full hypothesis.
- **Alternative route around heterogeneity:** The second target is proposed to maintain delivery in cells poorly served by the first. Preserve subpopulation identity during the comparison; an improved pooled average could otherwise conceal persistent failure in the intended rescued group.
- **Biparatopic receptor reorganization:** Two epitopes on one receptor are proposed to change clustering or trafficking. Use a receptor-level and trafficking-specific design rather than treating the epitopes as independently distributed antigens; the published biparatopic HER2 study motivates this distinction ([Li et al., 2016](https://www.cell.com/cancer-cell/pdf/S1535-6108(15)00472-9.pdf)).

Single-arm controls, matched exposure and payload-only comparators are proposed discriminating controls, not interchangeable substitutes for the original molecule. Their interpretation must account for changes introduced by the control itself, including valency and conjugation. A useful control isolates a hypothesis only to the extent that its other relevant properties have been characterized.

## The biological system: recognition is an address, not a completed delivery

ADC activity is not a property of antigen density alone: transport, binding, intracellular processing, active-payload disposition and the cell's response to that payload can each alter the outcome, and resistance can arise at different steps in different experimental models ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)). Mechanistic ADC models accordingly couple multiple compartments and processes rather than treating antigen positivity as a sufficient efficacy variable, although their predictions remain conditional on their structures and assumptions ([Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)).

For this project, the organizing question is therefore not “How many relevant factors can we list?” It is “Which unmeasured process could change the interpretation of the comparison we are about to make?” The following sections define those dependencies and the experiments needed to distinguish them.

### Exposure and spatial access precede receptor abundance

A high-expression cell cannot capture conjugate that does not reach it, and rapid local binding can consume accessible ADC near vessels before it penetrates farther into tissue ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)). Smaller formats may improve penetration while also clearing more rapidly, so an apparent transport advantage can be opposed by reduced systemic exposure ([Deonarain et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698822/)).

The proposed architecture must distinguish administered dose, plasma exposure and local interstitial exposure. It must also distinguish intact payload-bearing species, total antibody and unconjugated payload rather than letting a single “concentration” field stand for all three. These are design requirements for a future exposure module, not quantities inferred from the present expression files.

For bispecific comparisons, higher avidity is therefore a hypothesis about local capture and retention, not an automatic statement about better tissue coverage. Any future claim about the direction of that tradeoff must be tested with a transport model and spatial observations rather than assumed from the format label; the experimentally demonstrated binding-site barrier provides the reason for this safeguard ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)).

### Coexpression is not co-engagement, and co-engagement is not productive uptake

The published biparatopic HER2 example linked its particular architecture to receptor clustering and altered trafficking; it does not establish that any two-target format with the same expression pattern will behave similarly ([Li et al., 2016](https://www.cell.com/cancer-cell/pdf/S1535-6108(15)00472-9.pdf)). Resistance literature also describes changes in binding and intracellular handling that are not explained simply by a lower measured receptor abundance ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)).

The design must keep five quantities separate: measured antigen signal, accessible therapeutic epitopes, bound conjugate, internalized conjugate and productively processed conjugate. The current audit addresses only the first and, with appropriate calibration, an estimate related to antigen abundance. It must not transform two fluorescence axes into a count of simultaneous binding events.

For a same-cell dual-target hypothesis, the missing mechanism may involve proximity, competition, geometry or route selection. For an intercellular-bridging hypothesis, paired expression on one cell is the wrong sufficient input: donor and recipient identities, contact and spatial arrangement must be added. Neither case authorizes an automatic AND or OR rule from the word “bispecific.”

### Trafficking determines whether uptake becomes useful delivery

Recycling, lysosomal routing, acidification and proteolysis are distinct processes, and changes in these processes have been associated with T-DM1 resistance in selected experimental systems ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)). In one described resistance mechanism, ADC accumulated in lysosomes while reduced acidification and proteolytic activity impaired its productive processing; more intracellular signal was not evidence of more active payload ([Hunter et al., 2020, discussing Ríos-Luci et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)).

A future model must therefore represent recycling as a competing route and productive processing as a separately observed or fitted process. “Internalization rate” must not act as a hidden aggregate parameter for endocytosis, lysosomal arrival, linker cleavage, catabolism and membrane escape. If the data cannot separate these processes, the output must name the identifiable aggregate rather than assign a plausible-looking value to each rate.

This is especially important when considering a second target as a trafficking route. The specification should ask whether that route increases productive delivery under the tested exposure schedule, not merely whether it increases an uptake readout.

### Releasing a catabolite and reaching its intracellular target are different events

For the T-DM1 catabolite Lys-SMCC-DM1, direct transport studies identified SLC46A3-mediated, proton-coupled lysosomal transport, establishing a specific mechanism between lysosomal generation and access beyond that compartment ([Tomabechi et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/)). This is evidence for a particular catabolite and transporter, not a universal requirement that all ADC payloads use that route ([Tomabechi et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/)).

Consequently, the future architecture must distinguish linker cleavage or antibody degradation from active-species escape, and distinguish lysosomal-membrane transport from plasma-membrane entry or exit. A single “payload permeability” slider would erase the very biology the model is intended to examine.

Efflux and altered intracellular susceptibility have also been implicated in some resistant models, with context-dependent and sometimes conflicting evidence across systems ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)). The corresponding module must treat transporter expression as supporting context, not as a measured efflux rate or proof of a causal resistance mechanism.

### Payload pharmacology connects exposure history to cell fate

For a microtubule-directed payload such as DM1, the resistance literature includes altered cell-cycle progression, mitotic responses and apoptotic competence in addition to delivery defects ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)). Equal antigen expression or even equal intracellular delivery therefore does not establish equal downstream sensitivity ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)).

The future pharmacodynamic module must be selected for the payload mechanism, not populated by a universal Hill curve. A proposed DNA-damage module would need damage generation and repair states; a proposed mitosis-dependent module would need cell-cycle context and a definition of lethal versus nonlethal arrest. These are alternative model-design requirements, not assertions that one common parameterization covers both.

The measured endpoint must be stated explicitly: intracellular target engagement, damage, growth inhibition, death, viable cell number or population regrowth. The equations below show why a reduced endpoint cell count does not by itself identify a death rate. The same principle applies when interpreting an aggregate assay signal: the measurement model must be specified before the biological state can be inferred.

### Bystander activity makes the relevant unit a neighborhood

Extracellular release can support activity without requiring internalization by the eventual payload-recipient cell, as demonstrated in a preclinical matrix-targeted conjugate study ([Dal Corso et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5844458/)). A recent mechanistic modeling study also shows how heterogeneous targeting and payload transfer can interact, while explicitly leaving spatial and several resistance processes outside its well-mixed framework ([Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)).

For Antigen-tail Check, this means a target-low cell must not automatically be labeled an untreatable cell. The proposed spatial extension would require donor-cell processing, extracellular active-payload availability, recipient uptake, recipient susceptibility and distances or mixing assumptions.

This creates a useful distinction: a recognition-poor cell may still be a payload recipient, while a recognition-rich cell may be a poor payload producer. Two preparations with the same joint antigen distribution could still differ in how these cell states are arranged. The existing single-cell table cannot identify that arrangement.

### Additional mechanisms and tolerability constrain the comparison

Antibody-mediated signaling and immune-effector mechanisms can contribute alongside payload delivery, but their relevance depends on the construct and biological system ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)). They must therefore be optional, separately supported mechanisms rather than implicit benefits assigned to every Fc-containing format.

Preclinical activity can also be limited by toxicity, and format or conjugation changes can affect disposition rather than simply increase delivered payload in proportion to nominal loading ([Dal Corso et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5844458/); [Deonarain et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698822/)). Accordingly, any later translational comparison must distinguish equal administered ADC, equal nominal payload equivalents, equal measured exposure and a tolerability-constrained regimen.

The first release must make none of those regimens equivalent by assumption. It must also avoid “therapeutic index” language when no host-toxicity component has been measured or modeled.

## A striking case: better distribution, less delivery per cell, more efficacy

In a preclinical study of T-DM1, adding unconjugated trastuzumab at a fixed ADC dose improved intratumoral penetration and increased efficacy and survival in a trastuzumab-insensitive xenograft model, despite decreasing ADC delivery per cell and without increasing total tumor ADC uptake ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)). The unconjugated antibody could antagonize ADC activity in vitro while improving performance in vivo, where spatial access created a different constraint ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)).

This is not a recommendation to add carrier antibody to an arbitrary ADC. It is a counterexample to the design assumption that maximizing uptake by an already accessible cell must maximize population-level efficacy.

The study changed the antibody mixture and its effective average payload loading, not the chemical DAR of each ADC molecule, and its findings arose in a particular preclinical setting rather than establishing a universal clinical rule ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)). Those distinctions should appear with the example whenever it is used.

For a bispecific extension, this becomes a mandatory counterfactual question: could stronger capture by double-high cells improve those cells' delivery while depriving more distant cells of exposure? The coexpression audit can show where high-capture populations might reside in expression space; only spatial and kinetic evidence can resolve the proposed consequence.

The intellectual point is pleasantly inconvenient. A molecule can become better at delivering to the cells it already reaches while becoming no better, or potentially worse, at reaching the cells that determine the outcome. The model should make that possibility inspectable, not optimize it away.

## Mechanistic mathematical architecture for later, separately validated modules

The following equations are independently specified generic bookkeeping and hypothesis structures. They are not implemented in `v0.2.0-alpha`, are not fitted to a named therapeutic, and are not a complete executable ADC model. Published work motivates separating transport, processing and response, but does not validate this proposed architecture or supply its parameters ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/); [Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)).

### The joint distribution must eventually include biological state

Let a cell have antigen measurements \(x,y\), additional biological state \(z\), and position \(\mathbf r\). Here \(z\) is a declared collection of variables such as processing capacity or payload susceptibility, not an unmeasured scalar that the software pretends to know. A general future outcome is

\[
Y_j(t)=\mathcal F\!\left[
P_j(x,y,z,\mathbf r,0),\ C_p^{\mathrm{intact}}(0{:}t),\
\phi,\ \psi,\ \mathcal N,\ t
\right],
\]

where \(\phi\) describes the chosen recognition/format model, \(\psi\) describes linker and payload mechanisms, and \(\mathcal N\) describes spatial interactions. The current audit measures only an empirical projection onto \(x,y\). The functional \(\mathcal F\) is deliberately unspecified until a question, endpoint and identifiable model have been selected.

In a restricted, cell-autonomous model with externally prescribed exposure \(C\), the response average would instead take a form such as

\[
\overline S_j(t)=\int S(x,y,z;C(0{:}t),\phi,\psi)\,
P_j(dx\,dy\,dz).
\]

Even if \(P_A(x,y)=P_B(x,y)\), these integrals need not match when \(P_A(z\mid x,y)\ne P_B(z\mid x,y)\). Conversely, different coexpression does not guarantee different response if the relevant response function is insensitive to that difference. These are mathematical statements about what the measured projection does and does not identify.

This is why an average “processing efficiency” must not simply be multiplied by an average “double-positive fraction.” Such a product generally discards the association between expression and processing. Multiplying conditional probabilities along a correctly specified chain can be valid; multiplying separately measured marginal efficiencies does not supply those conditional probabilities.

### Minimal intracellular accounting for one explicitly chosen route

For a hypothetical lysosome-processed, internalizing conjugate, define the following amounts per cell:

- **\(b\):** Surface-bound ADC, in mol ADC/cell.
- **\(e\):** Internalized ADC in a pre-lysosomal compartment, in mol ADC/cell.
- **\(l\):** ADC in a processing compartment, in mol ADC/cell.
- **\(q\):** Released active catabolite in that compartment, in mol payload/cell.
- **\(p\):** Free active cytosolic payload, in mol payload/cell.

One candidate accounting system is

\[
\begin{aligned}
\dot b &= J_{\mathrm{bind}}-J_{\mathrm{diss}}
         -k_{\mathrm{int}}b+k_{\mathrm{rec}}e,\\
\dot e &= k_{\mathrm{int}}b
         -(k_{\mathrm{rec}}+k_{EL}+k_{E,\mathrm{loss}})e,\\
\dot l &= k_{EL}e-(k_{\mathrm{cat}}+k_{L,\mathrm{loss}})l,\\
\dot q &= \nu_{\mathrm{act}}k_{\mathrm{cat}}l
         -(k_{\mathrm{esc}}+k_{Q,\mathrm{loss}})q,\\
\dot p &= k_{\mathrm{esc}}q+J_{\mathrm{in,ext}}
         -(k_{\mathrm{eff}}+k_{\mathrm{met}})p .
\end{aligned}
\]

All \(k\) terms have units of inverse time. \(J_{\mathrm{bind}}\) and \(J_{\mathrm{diss}}\) are ADC amount per cell per time; \(J_{\mathrm{in,ext}}\) is payload amount per cell per time. The yield \(\nu_{\mathrm{act}}\) has units mol active payload/mol processed ADC and must not silently be equated to nominal mean DAR.

This system assumes recycled conjugate returns to the bound surface pool and that one effective processing route is appropriate. A different recycling fate or a linker that releases payload in another compartment requires a changed state graph, not a relabeled parameter. The system also lacks receptor synthesis, turnover, free/bound receptor bookkeeping, binding stoichiometry and initial conditions; those must be supplied before execution.

Require nonnegative rate constants and initial states, nonnegative available pools and physically admissible flux laws. The steady-state expressions below require positive denominators. For finite-time experiments, a steady-state approximation must be justified by the relevant timescales; in particular, very slow escape cannot be treated as instantaneous eventual delivery.

The per-cell balances as written describe a nondividing tracked cell with fixed compartment volumes. Coupling them to proliferation requires payload partition at division or a consistent dilution/state-transition treatment; coupling them to cell death requires an explicit fate for residual intracellular material. Otherwise a growing or dying population can create or destroy modeled payload by bookkeeping alone.

For a dual-target molecule, \(J_{\mathrm{bind}}\) must ultimately arise from an explicitly defined reaction scheme with receptor and conjugate conservation. Separate X-bound, Y-bound and bridged states may be needed. Substituting \(xy\), a product of Hill scores, or \(\min(x,y)\) for the binding flux without a derivation is not an acceptable mechanistic implementation.

The last equation assumes cytosolic payload binding does not appreciably deplete the free pool. Where that approximation fails, add target-bound payload as an explicit state and conserve free plus bound payload. If processing produces multiple active or inactive catabolites, add distinct species rather than assigning them one potency.

Two useful consequences follow from the proposed equations. Holding lysosomal ADC amount \(l\) fixed, the quasi-steady productive escape flux would be

\[
J_{\mathrm{escape}}^{ss}
=\nu_{\mathrm{act}}k_{\mathrm{cat}}l
\frac{k_{\mathrm{esc}}}{k_{\mathrm{esc}}+k_{Q,\mathrm{loss}}}.
\]

Thus the processing rate and escape fraction are separately relevant in this model. A large \(l\) alone cannot identify either, and a larger \(l\) arising from slower catabolism is not equivalent to increased productive flux. The documented distinction between lysosomal processing and catabolite transport is the biological reason to test these separate states ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/); [Tomabechi et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/)).

### Add transport only when spatial access is the question

A generic tissue free-ADC balance could be written

\[
\frac{\partial C}{\partial t}
=D_{\mathrm{ADC}}\nabla^2 C
+s_v(\mathbf r,t)
-\rho(\mathbf r,t)\left\langle
J_{\mathrm{bind}}-J_{\mathrm{diss}}
\right\rangle_{\mathbf r}
-k_{\mathrm{deg}}C.
\]

Here \(C\) is mol ADC per tissue volume, \(D_{\mathrm{ADC}}\) is length squared per time, \(s_v\) is vascular input in mol per volume per time, and \(\rho\) is cells per volume. The local average converts cell-level fluxes into a tissue sink or source. This simplified balance omits convection and requires geometry, initial conditions, boundary conditions and a specified vascular source; without them, it is not a solvable exposure model.

For a linearized local capture rate \(k_{\mathrm{capture}}\), a useful exploratory dimensionless group is

\[
\mathrm{Da}=\frac{k_{\mathrm{capture}}L_{\mathrm{tissue}}^2}
{D_{\mathrm{ADC}}}.
\]

This compares a diffusion timescale with a capture timescale under the stated linear approximation. It is not a universal efficacy index or a substitute for concentration-dependent binding. The experimental binding-site barrier motivates examining this competition rather than assuming that faster capture is uniformly beneficial ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)).

For extracellular active payload \(c_e\), a compatible candidate balance is

\[
\frac{\partial c_e}{\partial t}
=D_p\nabla^2c_e+s_{\mathrm{release}}
+\rho\langle k_{\mathrm{eff}}p-J_{\mathrm{in,ext}}\rangle_{\mathbf r}
-k_{\mathrm{clear}}c_e .
\]

All source terms must be expressed in mol payload per volume per time. \(s_{\mathrm{release}}\) includes only specified extracellular generation or release routes, not payload already counted in the efflux term. Any release after cell death requires an explicit reservoir and release rule.

In a homogeneous, linear diffusion-loss approximation, a characteristic length is

\[
\ell_p\sim\sqrt{D_p/k_{\mathrm{loss,eff}}}.
\]

This is a model-dependent decay length, not a measured bystander radius. Recipient uptake, extracellular loss, boundaries and heterogeneous spacing can invalidate a simple radial interpretation. The future module must distinguish those assumptions from experimental evidence.

### Translate intracellular exposure into the specified endpoint

Let \(c_{\mathrm{cyt}}=p/V_{\mathrm{cyt}}\), where cytosolic volume is in volume per cell. One optional phenomenological damage model is

\[
\dot d=k_{\mathrm{damage}}\,f(c_{\mathrm{cyt}},z)
-k_{\mathrm{repair}}d,
\qquad
h(t)=h(d(t),z(t)),
\]

where \(d\) and \(f\) are dimensionless, both \(k\) values have units of inverse time, and death hazard \(h\) is nonnegative with units of inverse time. The functions \(f\) and \(h\) must be separately declared and tested; an affinity-like midpoint must not be borrowed from an expression assay.

For a nondividing cohort with no state transitions, survival under that hazard is

\[
S(t)=\exp\!\left[-\int_0^t h(u)\,du\right].
\]

For a simplified dividing population,

\[
\dot N(t)=[r(t)-h(t)]N(t).
\]

These equations make an important identifiability limit explicit: the same endpoint \(N(t)\) can arise from different combinations of proliferation and death. A viability endpoint alone cannot identify both. More elaborate implementations would need separate states for arrest, death, recovery and resistant subpopulations if those are part of the question.

A fluorescence, luminescence or metabolic readout requires its own observation equation, for example \(Y_{\mathrm{obs}}(t)=a(t,z)N(t)+b(t)\), and validation of the assumptions about per-cell signal \(a\) and background \(b\). The model must not silently set a potentially changing per-cell signal to a constant.

### Normalization must follow the biological comparison

The reporting contract for any later experimental module must record which quantity was held equal: conjugate molarity, antibody mass, nominal payload equivalents, measured extracellular exposure, intracellular active-payload exposure or a specified tolerability constraint. Different normalizations answer different questions by definition.

For a distribution of loading states \(d\), nominal circulating conjugated payload equivalents would be represented as

\[
C_{\mathrm{payload,nominal}}(t)=\sum_d d\,C_d(t),
\]

where \(C_d\) is the molar concentration of conjugate species bearing \(d\) payloads. This bookkeeping does not establish active intracellular exposure; it also does not imply that different loading states have identical disposition. Conjugation-dependent disposition is a reason not to collapse the distinction prematurely ([Deonarain et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698822/)).

## Interactions the model must not simplify into a ranking

The scientific objective is to identify which process limits the chosen endpoint under the tested conditions. It is not to give every desirable-sounding property a positive weight and add the weights.

- **Capture versus coverage:** Strong local capture can compete with penetration; a lower amount delivered per accessible cell can coexist with improved overall efficacy when more cells are reached ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)). Future tests must distinguish amount per reached cell from fraction of cells reached.
- **Uptake versus processing:** Intracellular accumulation can accompany defective productive processing rather than successful delivery ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)). Future tests must pair an uptake measure with active-species or downstream engagement evidence.
- **Release versus escape:** Generating a catabolite in one compartment and transporting it across that compartment's membrane are separable events ([Tomabechi et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/)). Future tests must not assign a release defect from a cytosolic deficit alone.
- **Retention versus redistribution:** Model-based analyses can produce competing effects of intracellular retention and payload transfer between cells; their direction depends on the modeled target distribution, processing and sensitivity assumptions ([Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)). Future spatial modules must test these dependencies rather than assume greater permeability is always better.
- **Penetration versus exposure duration:** Faster entry by a smaller construct can be opposed by faster clearance ([Deonarain et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698822/)). Compare explicit exposure histories rather than equal nominal concentrations alone.
- **Expression versus susceptibility:** Delivery defects and downstream response defects can occur independently in selected resistance models ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)). A future integrated dataset must preserve the relationship between expression and susceptibility instead of joining unrelated population averages.

### An additional synthetic fixture: the expression ranking can reverse

Construct two hypothetical populations C and D, unrelated to the canonical expression-only fixture. Suppose a stipulated mechanism allows direct killing only among double-high cells, with no bystander effects, proliferation, exposure differences or alternative routes.

Let C contain 50% double-high cells, with a stipulated 20% conditional probability of death among those cells. Let D contain 30% double-high cells, with a stipulated 100% conditional probability of death among those cells. Under these assumptions,

\[
\Pr(\mathrm{death}\mid C)=0.50\times0.20=0.10,
\qquad
\Pr(\mathrm{death}\mid D)=0.30\times1.00=0.30.
\]

The lower-double-high population has the higher stipulated death fraction. This is exact conditional-probability arithmetic, not an experimentally calibrated ADC prediction. It belongs in the explanatory material, not in the P0 numerical engine or its default output.

The reason for the fixture is precise: a coexpression ranking is not a response ranking unless the conditional response assumptions are justified. The application must make that missing condition visible.

## Measurement and identifiability contract

A future mechanistic module must state which quantity each assay identifies, what other processes can produce the same signal, and what additional observation distinguishes the alternatives. The following are proposed evidence requirements, not standardized laboratory protocols or claims that every measurement is experimentally easy.

- **Expression:** Paired, appropriately controlled quantitative measurements identify joint measured abundance in the sampled preparation. They do not identify therapeutic epitope accessibility or simultaneous engagement; calibration and compatible measurement conditions remain necessary ([Wang and Hoffman, 2017](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=921423)).
- **Binding and uptake:** The validation plan should distinguish surface-associated from internalized material and use time-resolved observations. Total cell-associated fluorescence must not be designated an internalization rate without an observation model.
- **Recycling and routing:** The plan should include observations capable of distinguishing return to the surface from delivery to the processing compartment. An uptake time course alone must not be assumed to identify both rates.
- **Acidification and processing:** Pair pH-sensitive observations with appropriate pH-independent material tracking and, where feasible, processing or catabolite evidence. Altered acidification can change the interpretation of pH-sensitive uptake signals, and impaired lysosomal processing has been implicated in resistance ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/)).
- **Active species:** Where feasible, use species-resolved analytical measurements and compartment-aware methods with recovery controls. Label a total intracellular payload measurement as total; do not rename it free cytosolic active concentration.
- **Downstream susceptibility:** Include a payload-only comparator, but specify the chemical species and delivery route. External free-payload exposure is not automatically equivalent to intracellular delivery of a linker-bearing catabolite, as the specific transport requirements of Lys-SMCC-DM1 illustrate ([Tomabechi et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/)).
- **Bystander transfer:** Prespecify donor and recipient identities, their individual sensitivities and their spatial or mixing relationship. The study design should distinguish transfer from direct recipient targeting and from extracellular release.
- **Cell fate:** Measure growth and death separately where those rates are to be estimated. Use a time series or post-exposure follow-up when the claim concerns delayed killing, recovery or durable control, rather than treating one terminal signal as all three.
- **Population evolution:** Preserve lineage or subpopulation identity when the question concerns selection or regrowth. A baseline expression distribution should not silently be treated as constant during prolonged treatment.

A single concentration-response curve must not be used to estimate every rate in the proposed mechanistic architecture. Before fitting, require structural identifiability analysis where tractable, or an explicit demonstration of parameter nonuniqueness; after fitting, examine practical uncertainty, parameter correlations and predictive performance on held-out conditions. Synthetic parameter-recovery tests are necessary computational checks but do not replace validation with independent biological observations.

For the simple steady-state payload balance above, without extracellular input,

\[
p^{ss}=
\frac{\nu_{\mathrm{act}}k_{\mathrm{cat}}l}
{k_{\mathrm{eff}}+k_{\mathrm{met}}}
\frac{k_{\mathrm{esc}}}{k_{\mathrm{esc}}+k_{Q,\mathrm{loss}}}.
\]

One measured \(p^{ss}\) cannot uniquely identify all quantities on the right. Multiple combinations of release, escape and loss produce the same value. The correct output may therefore be an identifiable combination or a range of compatible mechanisms, not a ranked list of molecular explanations.

Model comparison must also include a simpler alternative. If a more elaborate model cannot make a validated distinction unavailable to the smaller model, additional states have added narrative capacity rather than demonstrated explanatory value.

## Staged development: small questions, connected biology

The broader architecture is a map of future questions, not authorization to implement every compartment now. Each subsequent module requires its own specification, data requirements, provenance review and validation release.

### Next release: coexpression plus the inference boundary

Implement the P0 requirements in this document: paired distributions, marginal-only bounds, optional hypothetical score scenarios, exact synthetic fixtures and the mechanism-evidence panel. Keep the biological calculations limited to what the inputs support. No receptor, processing, pharmacokinetic or payload parameters should be invented to fill missing data.

### Candidate follow-up: productive-delivery check

Select one explicit intracellular route and ask: “Does increased internalization imply increased active-payload delivery in this measured system?” A minimal implementation could compare identifiable flux combinations rather than fit every compartment. Require time-resolved uptake/processing observations and a clearly specified active-payload or target-engagement readout before considering quantitative biological predictions.

Validation must include synthetic trapping-versus-processing cases, competing recycling routes, conservation checks, nonnegative states, zero-input limits and exposure-history sensitivity. Published resistance and transport findings provide motivation for separating these processes, not calibration of the hypothetical module ([Hunter et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/); [Tomabechi et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/)).

### Candidate follow-up: capture-versus-coverage check

Ask whether a proposed change improves delivery to cells already reached, the number of cells reached, or both. Begin with an explicitly simplified geometry and measured or bounded exposure inputs, using spatial uptake observations for validation. Do not infer this tradeoff from suspension-cell expression files.

The Cilliers study is an appropriate qualitative challenge case: a useful model must at least permit the experimentally observed direction of a distribution benefit rather than enforce monotonic improvement with per-cell uptake by construction ([Cilliers et al., 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/)). Reproducing its numerical results would be a separate data-reconstruction and validation project.

### Candidate follow-up: donor-recipient and regrowth checks

Only after defining payload production and susceptibility should a later model introduce transfer between cells or selection over repeated exposure. Choose either a well-mixed donor-recipient question or a spatial question explicitly; one must not be marketed as the other.

Release criteria should include donor-only, recipient-only and no-transfer limits; a distinction between direct and transferred exposure; mass-balanced payload accounting; and held-out testing of the chosen endpoint. Any host-toxicity or dosing-optimization module would be a still-separate undertaking, not an extra toggle on this expression audit.

## Prospective experimental validation

Computational correctness and empirical validity are separate gates. The following is an experimental design framework, not an executed study or a proprietary assay procedure.

First establish paired-measurement validity, including compatible gates and evidence that the detection reagents do not materially distort the two-axis measurement. Record the calibration definition, resolution limits and independent biological preparations; calibration labels alone do not establish equivalent measurements ([Wang and Hoffman, 2017](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=921423)).

For the decisive distribution experiment, assemble independently characterized populations that approximate the canonical contrast: matched X and Y marginals but different same-cell association. Confirm the match from actual paired measurements, not solely from intended mixing proportions. Account for cell size, state, lineage, viability and other differences that could confound the interpretation.

For functional exploration, prespecify one endpoint and compare the appropriate dual-target format with relevant single-target controls and an unconjugated control. Include free-payload sensitivity as a separate check of downstream susceptibility; it does not by itself establish sensitivity to the intracellularly released catabolite.

Measure binding, uptake, productive delivery and the downstream functional endpoint separately where feasible. A change in one step should not automatically be named as a change in another. For formats where exposure or tissue access is part of the rationale, add pulse/washout or structured-culture experiments as separate studies rather than assuming a static monolayer establishes those advantages.

If a response map is fitted, use independent training conditions, freeze the map, and evaluate held-out biological preparations. Preserve replicate identity; a large number of cell events does not replace independent preparations. Report failure of the shared-response assumption as a finding, not as a reason to repeatedly retune the midpoint until the model appears predictive.

## Release and provenance gates

Implementation should begin on a feature branch. Do not alter the published `v0.1.0-alpha` tag, release archive or historical validation receipt; a `v0.2.0-alpha` release requires its own reviewed changes, tests and clearly dated validation record.

Before publication, require all P0 mathematical tests, original single-antigen regression tests, and deployed-browser checks. Browser coverage must include paired and marginal modes, cutoff ties, mixed axis units, rejected unpaired data, empirical declarations, imports, invalid inputs, cancellation, exports, dark/light toggling, keyboard access, desktop and mobile layouts, and all source/math/release links.

GitHub Pages should remain test-gated. Verify the actual deployed interface, not only the local build, and distinguish the immutable release snapshot from a live demo that follows `main`.

All demonstration datasets and default response parameters must remain synthetic. Do not include employer-specific constructs, sequences, platforms, proprietary observations, protected engineering recipes, or fitted therapeutic parameter sets. Public papers support scientific motivation and limits only; neither citation nor an MIT software license grants rights to practice all methods described in those papers.

The reviewed source texts for this specification did not reveal the explicitly excluded employer terms or examples in the selected full texts and available references. This is a bounded provenance screen, not an assurance that every indirect relationship has been excluded or a claim-specific freedom-to-operate opinion. It does not establish that published scientific methods are unpatented. Any new source, real dataset, or molecule-specific implementation requires a new review before public inclusion.

## Published references

1. **Cilliers C, Menezes B, Nessler I, Linderman J, Thurber GM.** Improved Tumor Penetration and Single-Cell Targeting of Antibody–Drug Conjugates Increases Anticancer Efficacy and Host Survival. Cancer Research. 2018;78(3):758–768. DOI: 10.1158/0008-5472.CAN-17-1638. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/). Focal primary study illustrating that improved distribution can outweigh lower per-cell ADC delivery; the particular preclinical result is not a universal dosing recommendation.

2. **Li JY, Perry SR, Muniz-Medina V, et al.** A Biparatopic HER2-Targeting Antibody-Drug Conjugate Induces Tumor Regression in Primary Models Refractory to or Ineligible for HER2-Targeted Therapy. Cancer Cell. 2016;29:117–129. DOI: 10.1016/j.ccell.2015.12.008. [Full text](https://www.cell.com/cancer-cell/pdf/S1535-6108(15)00472-9.pdf). The retrieved PDF includes the 2019 correction, DOI: 10.1016/j.ccell.2019.05.010. Used for the format/trafficking distinction, not as a parameter source.

3. **Hunter FW, Barker HR, Lipert B, et al.** Mechanisms of resistance to trastuzumab emtansine (T-DM1) in HER2-positive breast cancer. British Journal of Cancer. 2020;122:603–612. Published online December 16, 2019. DOI: 10.1038/s41416-019-0635-y. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC7054312/). Review used to distinguish binding, trafficking, processing, transport and downstream susceptibility. Much of the discussed mechanistic evidence is model-specific rather than clinically validated.

4. **Tomabechi R, Kishimoto H, Sato T, et al.** SLC46A3 is a lysosomal proton-coupled steroid conjugate and bile acid transporter involved in transport of active catabolites of T-DM1. PNAS Nexus. 2022;1(3):pgac063. DOI: 10.1093/pnasnexus/pgac063. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896951/). Primary transport evidence for a specific active catabolite, not a universal ADC escape mechanism.

5. **Wood NE, Cengiz A, Gao M, Ratushny AV, Straube R.** Mechanistic modeling suggests stroma-targeting antibody-drug conjugates as an alternative to cancer-targeting in cases of heterogeneous target expression. PLOS Computational Biology. 2025;21(8):e1012839. DOI: 10.1371/journal.pcbi.1012839. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/). Computational evidence for coupled delivery and response hypotheses; simulated advantages remain conditional on model assumptions. No equations or fitted therapeutic parameters from this paper are reproduced here.

6. **Deonarain MP, Yahioglu G, Stamati I, et al.** Small-Format Drug Conjugates: A Viable Alternative to ADCs for Solid Tumours? Antibodies. 2018;7(2):16. DOI: 10.3390/antib7020016. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC6698822/). A review used for the penetration–clearance boundary, not evidence that every smaller format is superior.

7. **Dal Corso A, Gébleux R, Murer P, Soltermann A, Neri D.** A Non-internalizing Antibody-Drug Conjugate Based on an Anthracycline Payload Displays Potent Therapeutic Activity in vivo. Journal of Controlled Release. 2017;264:211–218. DOI: 10.1016/j.jconrel.2017.08.040. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC5844458/). Used to establish the boundary between target localization and payload-recipient identity; preclinical findings are not clinical validation.

8. **Wang L, Hoffman RA.** Standardization, calibration, and control in flow cytometry. Current Protocols in Cytometry. 2017;79:1.3.1–1.3.27. DOI: 10.1002/cpcy.14. [Full text](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=921423). Used for measurement comparability and calibration boundaries.

The general probability identities, bounds and synthetic fixtures above are derived explicitly in this specification. No proprietary construct or therapeutic parameter set is required to implement them.
