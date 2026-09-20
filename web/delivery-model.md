# Lower uptake, higher productive delivery

## An executable synthetic worked example

This companion to Antigen-tail Check follows a prescribed ADC entry flux through four intracellular compartments. It is an original linear model with invented parameters, not a fit to a therapeutic construct or a prediction of efficacy. Published in repository release v0.2.0-alpha, calculation revision delivery-9; the historical component identifier is 0.2.6-example. A separate, opt-in [pharmacodynamic hypothesis layer](delivery-pd-math.md) tests the consequences of time-dependent engagement and downstream recovery without changing the delivery calculation. Its interpretation audit separates the endpoint ratio into dependent accounting terms, locates sampled changes in readout ordering, and proposes measurements that could challenge the hypotheses.

Open the [public browser model](https://datarichinsightpoor.github.io/antigen-tail-check/productive-delivery.html). Start with “Half the entry, better routing,” then load the matched-routing control, slow-processing challenge, pulse-input case, indistinguishable-payload case and competing-loss case. All rates and input fluxes can be changed independently for A and B; a shared effective payload yield and observation duration remain explicit.

## The question and the answer

Can a lower internalization input deliver more active payload to the cytosol? Under this model, yes, if its routing, productive processing and escape more than compensate for the smaller input. Lower uptake is not intrinsically beneficial, and the model does not infer the mechanism from an uptake measurement.

The invented constant-input case is:

| Parameter | A | B | Units |
|---|---:|---:|---|
| Prescribed internalization input J | 100 | 50 | ADC/cell/h |
| Endosomal transfer to lysosome klys | 1 | 1 | h⁻¹ |
| Endosomal recycling/return krec | 9 | 1 | h⁻¹ |
| Lysosomal processing kproc | 2 | 2 | h⁻¹ |
| Competing intact-lysosomal loss kloss,I | 0 | 0 | h⁻¹ |
| Payload escape kesc | 1 | 1 | h⁻¹ |
| Lysosomal payload loss kloss,L | 1 | 1 | h⁻¹ |
| Cytosolic payload removal kloss,C | 1 | 1 | h⁻¹ |
| Effective payload yield ν | 1 | 1 | payload/processed ADC |

All stocks start at zero. The default observation window is 24 hours and input continues throughout.

The productive-routing fractions are 0.1 and 0.5. ADC entering lysosomal processing at steady state is therefore 10 versus 25 ADC/cell/h. Half the released payload escapes to the cytosol, giving **5 versus 12.5 payload/cell/h** of active arrival. The lower-entry case has 2.5 times the steady cytosolic arrival flux; with equal cytosolic removal rates, it also has 2.5 times the steady cytosolic stock.

At finite times, the ratios need not equal their steady limits. The app reports the simulated arrival flux, stock and time-integrated exposure separately rather than substituting the steady result for the observed window.

## State definitions

- **E:** intact endosomal ADC, ADC/cell.
- **L:** intact lysosomal ADC, ADC/cell.
- **Plys:** released lysosomal payload, payload/cell.
- **Pcyt:** assumed active, unbound cytosolic payload, payload/cell.
- **R:** cumulative intact ADC returned out of the modeled domain, ADC/cell.
- **DI:** cumulative nonproductive diversion from intact lysosomal ADC before productive payload release, ADC equivalents/cell.
- **DL and DC:** cumulative payload removed from lysosomal and cytosolic compartments, payload/cell.
- **U:** cumulative prescribed ADC input, ADC/cell.
- **Q:** cytosolic payload area under the curve, payload·h/cell.

These are per-cell molecular amounts, not concentrations. Converting them to molarity requires an explicit compartment volume and a molecule-to-mole conversion. “Active” is a declared species assumption, not a simulated pharmacodynamic effect.

## Differential equations

\[
\frac{dE}{dt}=J(t)-(k_{\mathrm{lys}}+k_{\mathrm{rec}})E
\]

\[
\frac{dL}{dt}=k_{\mathrm{lys}}E-(k_{\mathrm{proc}}+k_{\mathrm{loss,I}})L
\]

\[
\frac{dP_{\mathrm{lys}}}{dt}
=\nu k_{\mathrm{proc}}L-(k_{\mathrm{esc}}+k_{\mathrm{loss,L}})P_{\mathrm{lys}}
\]

\[
\frac{dP_{\mathrm{cyt}}}{dt}
=k_{\mathrm{esc}}P_{\mathrm{lys}}-k_{\mathrm{loss,C}}P_{\mathrm{cyt}}
\]

The cytosolic arrival flux is Fcyt(t) = kesc Plys(t). The auxiliary balances are:

```text
dR/dt  = krec E
dDI/dt = kloss,I L
dDL/dt = kloss,L Plys
dDC/dt = kloss,C Pcyt
dU/dt  = J(t)
dQ/dt  = Pcyt
```

Consequently, cumulative cytosolic arrivals equal Pcyt + DC for the zero initial state used here. They are not the same quantity as the cytosolic stock or its AUC.

### Mass accounting

Expressed in payload equivalents, the model conserves:

\[
\nu U=\nu(E+L+R+D_I)+P_{\mathrm{lys}}+P_{\mathrm{cyt}}+D_L+D_C.
\]

This is an accounting identity for payload equivalents carried by intact conjugate and released species, not a claim that an antibody and its payload have the same molecular mass. The shared effective yield is fixed throughout each run; variable conjugation states and deconjugation outside the specified processing step are not modeled.

The new sink removes material from L without generating modeled active payload. “Intact loss” identifies the compartment from which material exits, not the chemical identity of its downstream products. DI records ADC equivalents diverted, not a concentration of intact conjugate in a fifth physical compartment. Its downstream products and possible recovery are outside the model. This generic irreversible failure route is a declared assumption, not an identified trafficking pathway.

The app reports the largest relative residual of this identity across the reported trajectory. That check detects numerical or implementation inconsistencies but cannot validate biological assumptions.

## Why the reversal occurs

With constant J and positive compartment exit rates, the steady cytosolic arrival is:

\[
F_{\mathrm{cyt,ss}}
=\nu J
\frac{k_{\mathrm{lys}}}{k_{\mathrm{lys}}+k_{\mathrm{rec}}}
\frac{k_{\mathrm{proc}}}{k_{\mathrm{proc}}+k_{\mathrm{loss,I}}}
\frac{k_{\mathrm{esc}}}{k_{\mathrm{esc}}+k_{\mathrm{loss,L}}}.
\]

The steady cytosolic stock is:

\[
P_{\mathrm{cyt,ss}}=\frac{F_{\mathrm{cyt,ss}}}{k_{\mathrm{loss,C}}}.
\]

For shared ν, B can have lower J and higher arrival only if the ratio of its routing-times-processing-times-escape fractions exceeds JA/JB, assuming the denominator is nonzero. A change in cytosolic removal can change stock and AUC without changing arrival flux, which is why the app does not use those quantities interchangeably.

The routing fraction refers to one internalization episode. Recycled material is counted in R and leaves this model; the model does not predict its eventual fate after surface return, rebinding or another round of endocytosis. J is an exogenous input, so no feedback from returned material alters it.

## Six experiments on the explanation

### Half the entry, better routing

The default parameters give the steady reversal described above. This establishes a mathematical counterexample to the proposition that more input necessarily means more productive delivery, not evidence that a particular ADC follows this mechanism.

### Matched routing control

Set B's recycling rate to 9 h⁻¹, matching A, while retaining half the input. All states, fluxes and accumulated exposures in B then equal one-half of A at every time because the remaining system is linear with the same zero initial condition. The reversal disappears.

### Slow-processing challenge

Retain B's favorable routing but reduce its processing rate from 2 to 0.02 h⁻¹, with both intact-loss rates still zero. The constant-input steady arrival advantage remains 2.5-fold because processing is L's only exit, but at the default 24-hour observation time B's arrival and cytosolic exposure lag; intact lysosomal ADC accumulates instead.

The cancellation of kproc from the steady flux is conditional on zero competing intact loss and positive processing. It does not mean processing is unimportant. It controls delay and inventory in that limit; the competing-loss case below changes the eventual yield as well. Saturation and cell division remain outside this model.

At 24 h in this synthetic slow-processing case, retained intact ADC is about 15 versus 493.708 ADC/cell, while cytosolic arrival is 5 versus 4.608 payload/cell/h and cytosolic AUC is 109.5 versus 52.645 payload·h/cell for A and B, respectively. B therefore has roughly 32.9 times the retained intact conjugate but only 0.481 times the cytosolic AUC. This is not a paradox: the accumulated intact material is upstream of payload release.

### Pulse input followed by chase

Set J(t) = J for 0 ≤ t < 2 h, then J(t) = 0. Processing and clearance continue after input ends, so instantaneous uptake and retained amounts cannot be substituted for continuing payload delivery.

The continuous-input steady values remain visible only as a counterfactual reference, labeled “If input continued.” The actual pulse ultimately approaches zero stock and zero arrival flux; cumulative quantities approach their respective totals. A prescribed internalization pulse is not automatically equivalent to washing extracellular ADC away, since a physical washout need not instantly stop entry from previously surface-bound material.

### Same payload trace, different routes

This fifth case is a constructed counterexample to unique inference, not merely another parameter sweep. Both cases use J = 100 ADC/cell/h and the original A rates, except that B uses klys = 2, krec = 8, kesc = 0.5 and kloss,L = 1.5 h⁻¹. B's routing fraction doubles from 0.1 to 0.2 while its escape fraction halves from 0.5 to 0.25. The steady cytosolic arrival remains 5 payload/cell/h.

The equality is stronger than a shared plateau. Define a = klys + krec, b = kproc + kloss,I, c = kesc + kloss,L and d = kloss,C. Taking Laplace transforms of the zero-initial-state equations gives:

\[
\frac{P_{\mathrm{cyt}}(s)}{J(s)}
=\frac{\nu k_{\mathrm{lys}}k_{\mathrm{proc}}k_{\mathrm{esc}}}
{(s+a)(s+b)(s+c)(s+d)}.
\]

Here s has units h⁻¹; the transfer function has units payload·h/ADC. For the constructed pair, intact loss is zero, a = 10, b = 2, c = 2, d = 1 h⁻¹ and the numerator equals 2 in the corresponding rate/yield units in both cases. Therefore the complete cytosolic payload time course is identical for any shared input history, including continuous input and a common pulse. Cytosolic arrival is also identical because d is unchanged and arrival = dPcyt/dt + d × Pcyt.

Within this pair, a denser cytosolic time course does not resolve the mechanism. Neither does switching both cases to the same pulse. B's L and Plys are twice A's at every positive time, B's cumulative returned ADC is 8/9 of A's, and E is unchanged. A second measurement helps only if it measures a quantity that differs.

The candidate-readout selector displays those computed trajectories and the quantities at the selected time node. It is an observability demonstration, not a calibrated observation model: there is no noise distribution, signal conversion, detection limit or formal experiment-optimization routine. These mathematical differences do not establish that a particular assay can detect or specifically attribute them.

The software checks a sufficient structural condition: equality of the named exit rates, transfer numerator and prescribed input amplitudes, with shared input schedule and zero initial conditions. It does not perform a complete structural-identifiability analysis. Failing this check does not establish identifiability; for example, permutations of denominator factors can preserve a transfer function without preserving each named rate.

### Slow processing meets competing loss

Start from the slow-processing case and set kloss,I = 0.2 h⁻¹ in both A and B. Everything else remains unchanged: A processes at 2 h⁻¹; B at 0.02 h⁻¹. The same competing rate has radically different consequences because it competes against different productive rates.

Under constant first-order hazards, survival in L for a residence time τ is exp[−(kproc + kloss,I)τ]. Integrating the productive exit density gives:

\[
f_{\mathrm{process}}
=\int_0^\infty k_{\mathrm{proc}}
e^{-(k_{\mathrm{proc}}+k_{\mathrm{loss,I}})\tau}\,d\tau
=\frac{k_{\mathrm{proc}}}{k_{\mathrm{proc}}+k_{\mathrm{loss,I}}}.
\]

The complementary nonproductive fraction is kloss,I/(kproc + kloss,I). Mean residence before either exit is 1/(kproc + kloss,I), while the productive and loss fluxes are kproc L and kloss,I L. A shorter residence time alone is therefore not evidence of better processing: faster loss also shortens residence.

A productively processes 10/11, or 90.91%, of material reaching L; B processes 1/11, or 9.09%. Their steady cytosolic arrivals become **4.545 versus 1.136 payload/cell/h**. B/A is 0.25, not 2.5: B's previous 2.5-fold steady advantage becomes a fourfold disadvantage. Its fivefold routing advantage cannot rescue a tenfold relative processing penalty combined with half the input.

The factorization is 0.5 × 5 × 0.1 × 1 = 0.25. B now needs J = 200 ADC/cell/h just to tie A, so there is no lower-entry/higher-steady-arrival interval under these rates. Setting both intact-loss rates back to zero preserves the slow B processing rate and restores the 2.5-fold steady advantage, but not the finite-time advantage at 24 hours.

For positive processing and positive arrival, the local steady-flux sensitivity is:

\[
\frac{\partial\log F_{\mathrm{cyt,ss}}}{\partial\log k_{\mathrm{proc}}}
=\frac{k_{\mathrm{loss,I}}}{k_{\mathrm{proc}}+k_{\mathrm{loss,I}}}.
\]

This derivative holds all other parameters fixed. Processing has no steady-flux sensitivity in the zero-loss limit, but approaches proportional control when loss dominates processing. The point is not that a particular ADC exhibits these invented rates; it is that a conclusion about processing depends on which competing fates the model permits.

The interface exposes DI as a candidate readout and reports both exit fluxes in the time-node table. DI is a modeled ledger, not automatically a measurable species; connecting it to an experiment would require an explicit observation model and evidence for the sink's physical meaning.

## Where the lower-entry advantage ends

Let η = [klys/(klys + krec)] × [kproc/(kproc + kloss,I)] × [kesc/(kesc + kloss,L)]. Holding A, B's rates and the shared yield fixed, the B input that ties A's constant-input steady cytosolic arrival is:

\[
J_{B,\mathrm{tie}}=\frac{F_{A,\mathrm{ss}}}{\nu\eta_B},
\qquad \eta_B>0.
\]

The default case gives 20 ADC/cell/h. B has lower input and higher steady arrival precisely when 20 < JB < 100 ADC/cell/h; equality at 20 is a tie, not an advantage. This is a deterministic one-parameter threshold under fixed assumptions, not an uncertainty interval or a fitted biological constant.

If ηB is zero, changing entry alone cannot produce cytosolic arrival in B. If A has zero steady arrival and ηB is positive, any positive B input exceeds the zero reference, but a fold advantage is undefined. The interface reports these cases explicitly instead of inventing a finite fold comparison.

For positive denominators, the B/A arrival ratio separates into:

\[
\frac{F_{B,\mathrm{ss}}}{F_{A,\mathrm{ss}}}
=\frac{J_B}{J_A}
\cdot\frac{f_{\mathrm{route},B}}{f_{\mathrm{route},A}}
\cdot\frac{f_{\mathrm{process},B}}{f_{\mathrm{process},A}}
\cdot\frac{f_{\mathrm{escape},B}}{f_{\mathrm{escape},A}}.
\]

The stock ratio adds a retention factor, kloss,C,A/kloss,C,B. Finite-time AUC requires a further window-completion factor, derived below; the steady factors alone are insufficient. For pulse mode, the entry threshold is labeled as a continuous-input counterfactual, not a pulse-AUC threshold.

## Processing-versus-loss map

The map asks a different question from the entry threshold: with A fixed and B's lower input unchanged, which combinations of B's processing and competing intact-loss rates preserve higher steady cytosolic arrival? Only these two rates vary. All of A, B's entry/routing/escape/removal parameters and the shared payload yield stay attached to the calculation.

Write B's loss-free steady-arrival ceiling as:

\[
C_B=\nu J_B f_{\mathrm{route},B}f_{\mathrm{escape},B}.
\]

At an inspected processing rate p and intact-loss rate ℓ, its steady arrival is:

\[
F_B(p,\ell)=C_B\frac{p}{p+\ell}.
\]

When A's reference arrival FA is positive and CB > FA, the exact tie boundary is:

\[
\ell=\left(\frac{C_B}{F_A}-1\right)p.
\]

B exceeds A below that line and falls below A above it, within the supported domain. This is a lower-entry advantage only when JB < JA. The map retains the above/below comparison if that condition fails, but explicitly refuses to call it a lower-entry advantage.

For the default case, CB = 12.5 and FA = 5 payload/cell/h, so the boundary is ℓ = 1.5p. In the competing-loss preset, A itself has the declared 0.2 h⁻¹ intact-loss rate and remains fixed at FA = 50/11; the boundary therefore shifts to ℓ = 1.75p. With B processing at 0.02 h⁻¹, it must have intact loss below 0.035 h⁻¹ to exceed A. At fixed B loss of 0.2 h⁻¹, processing must instead exceed 0.2/1.75, approximately 0.114286 h⁻¹. Equality is a tie, not survival of the advantage.

If CB < FA, no rate pair can rescue the advantage. If CB = FA > 0, positive processing with zero intact loss can only tie A. If FA = 0 and CB > 0, every supported pair with positive processing gives a positive arrival above zero, but a fold ratio is undefined. If both are zero, the whole supported map ties at zero.

### Display, inspection and application

The 81 × 81 grid spans rates from 0 to 10 h⁻¹ on both axes. Its coordinate transform is log10(1 + rate/0.001), which permits exact zero while resolving low-rate behavior. This is not a conventional logarithmic axis. Points with p + ℓ < 0.001 h⁻¹ are unsupported and hatched; the zero/zero origin has neither a finite residence time nor a defined branching fraction.

Colors classify grid samples; an independently calculated continuous boundary is drawn over them. The boundary may curve in these transformed display coordinates even though it is a straight line in physical rate coordinates. Rate pairs can be entered exactly or inspected by clicking the map. The circle marks the current simulated B and the diamond marks the inspection point. Inspection alone does not change the model; “Apply inspected rates to B” updates only those two rates and reruns the time course.

JSON includes fixed inputs, the grid, the current simulated point and boundary metadata. The separate CSV exports all 6,561 grid samples, including unsupported samples and their validity flags. Retain the full JSON alongside a map PNG or CSV for complete provenance. The temporary inspection point is printed on the PNG but is not substituted for the current simulated point in JSON; apply it first to save it as a full model run.

### What the boundary does not establish

Scaling p and ℓ together by the same positive factor preserves their branching fraction and therefore steady arrival. It changes the residence time 1/(p + ℓ), however, and can materially change a finite-time cytosolic AUC. Thus a point on the favorable side of this map need not have reached favorable delivery within the observation window. Applying a point to the kinetic model is the explicit next check.

In pulse mode this remains a continuous-input counterfactual, not a pulse endpoint, finite-time AUC or efficacy map. Neither the displayed rate domain nor the area of a colored region has a biological-probability interpretation. The numerical tie classifier uses a 10⁻¹² relative flux tolerance solely for floating-point arithmetic; it is not an experimental equivalence margin. No noise distribution, fitted rates or uncertainty prior is supplied.

## Finite-time cytosolic AUC map

A favorable steady arrival can arrive too late to give favorable accumulated cytosolic exposure within an assay. The second map therefore compares the actual finite-window quantity:

\[
Q(T)=\int_0^T P_{\mathrm{cyt}}(t)\,dt,\qquad
R_Q(p,\ell;T)=\frac{Q_B(T;p,\ell)}{Q_A(T)}.
\]

Here Pcyt is an amount per cell, not a concentration. Q has units payload·h/cell. A remains fixed; only B's processing rate p and intact-loss rate ℓ vary. The selected observation horizon, payload yield, all other rates and the actual continuous or pulse input schedule enter the calculation. Cytosolic removal matters directly: this is accumulated cytosolic amount, not cumulative arrival flux or a cell-killing endpoint.

The synthetic slow-processing example makes the distinction concrete. At 24 h, B has 2.5 times A's continuous steady arrival, yet its cytosolic AUC is approximately 52.6449 versus 109.5 payload·h/cell, a ratio of 0.480775. At 168 h its AUC exceeds A's. Neither result changes the interpretation of the other: one describes eventual throughput, the other describes exposure accumulated over a declared window.

### Evaluating the map without thousands of time-step simulations

The map evaluates the same linear compartment equations by a matrix exponential, starting from zero intracellular states. Define the four exit rates:

\[
a=k_{\mathrm{lys}}+k_{\mathrm{rec}},\quad
b=p+\ell,\quad
c=k_{\mathrm{esc}}+k_{\mathrm{loss,L}},\quad
d=k_{\mathrm{loss,C}}.
\]

For a normalized cascade, with s(t) equal to one during prescribed entry and zero afterward:

\[
\dot z_1=a(s-z_1),\quad
\dot z_2=b(z_1-z_2),\quad
\dot z_3=c(z_2-z_3),\quad
\dot z_4=d(z_3-z_4),\quad
\dot q=z_4.
\]

Writing Fss for the continuous steady cytosolic arrival under the declared input amplitude gives:

\[
P_{\mathrm{cyt}}(t)=\frac{F_{\mathrm{ss}}}{d}z_4(t),
\qquad Q(T)=\frac{F_{\mathrm{ss}}}{d}q(T).
\]

The implementation augments these five states with a constant state and exponentiates a 6 × 6 matrix. It scales the matrix to infinity norm at most 0.5, evaluates an 18-term Taylor expansion and then squares back to the requested duration. For a pulse, the on-phase state, including accumulated q, becomes the starting state of the off phase. No continued input is assumed after pulse cessation, and no subtraction of nearly equal long-time integrals is needed. Repeated exit rates are supported without partial-fraction singularities.

With all other rates fixed, the normalized time course depends on p and ℓ through their sum b. The grid caches these kernels and applies the actual productive fraction p/(p + ℓ) separately. This is an algebraic reuse of the same linear system, not an additional biological approximation. Zero productive flux gives zero AUC.

The matrix-exponential result is checked against independently time-stepped, half-step Runge–Kutta trajectories, including all presets, repeated rates, short and long windows, mixed fast/slow rates and non-grid pulse durations. A repeated-rate closed-form cascade supplies an additional analytical check. The trajectory plots continue to use the original Runge–Kutta solver; numerical agreement is an implementation check, not experimental validation.

### Inspection, boundaries and exports

The AUC map uses the same 81 × 81 domain, shifted-log axes and unsupported-point mask as the steady map. Its solid tie contour is interpolated between grid samples in display coordinates; it is not an exact analytical boundary. The steady map's dashed boundary remains analytical. Both are conditional slices through parameter space, not probabilities or uncertainty intervals.

Click a map point or enter its rates to calculate that point independently of the grid interpolation. A circle marks the current simulated B and a diamond marks the inspection point. “Apply inspected rates to B” changes only those two B rates, recomputes both maps and reruns the trajectories. Until applied, inspection does not change the model. Each map has its own inspector and a reset to the current simulated rates.

The point readout reports finite-time AUC, the B/A ratio, whether B actually has lower entry, and its separate continuous-input steady comparison. The `lateAdvantage` flag means steady arrival favors lower-entry B but AUC favors A at the selected horizon. It does not estimate a crossover time. In pulse mode only the separate steady comparison is counterfactual; the AUC result integrates the actual pulse and chase.

If A's AUC is zero, fold ratios remain undefined rather than becoming an invented finite number. Positive B AUC can still exceed zero; two zero values tie. A relative comparison tolerance of 10⁻¹⁰ addresses floating-point arithmetic only and is not an experimental equivalence margin.

Full JSON retains schema `productive-delivery/0.2` and adds `aucLossMap` alongside `processingLossMap`, with the fixed inputs, horizon and schedule, method metadata, grid, approximate contour and current simulated point. The AUC map CSV contains all 6,561 grid rows, a header and three metadata-comment lines; rows distinguish finite-time and steady classifications. The PNG records the window, schedule and inspected rates. As with the steady map, the transient inspection point is not substituted for the simulated point in JSON: apply it first to preserve it as a complete model run. Retain full JSON with CSV or PNG for reproducibility.

## Yield, timing and retention: an exact exposure decomposition

The maps become more useful when their colors can be explained. Revision delivery-6 adds an audit of the currently simulated cases, separating how much productive material an entered cohort can ultimately supply, when its exposure is realized, and how long cytosolic payload remains. These are distinct questions even when one experimental signal appears to answer all three.

Let D be the input-on duration up to the observation time T: D = T for continuous entry and D = τ for a pulse ending at τ ≤ T. Let N = JD be the total entered ADC and π = froute fprocess fescape the productive-path fraction. The eventual AUC from this entered cohort, assuming no further entry after T and unchanged rates, is:

\[
Q_{\mathrm{cohort},\infty}=\frac{\nu N\pi}{d},
\qquad
w(T)=\frac{Q(T)}{Q_{\mathrm{cohort},\infty}}.
\]

For positive cohort potential, w lies between zero and one. It is the fraction of eventual cohort AUC already realized, not the fraction of molecules that arrived, target occupancy, or a probability of killing. Even payload already in the cytosol can contribute additional future AUC. When the cohort potential is zero, its window fraction is undefined, not zero.

For the shared yield and input duration used here, the exact finite-window factorization is:

\[
\frac{Q_B(T)}{Q_A(T)}
=\frac{J_B}{J_A}
\frac{f_{\mathrm{route},B}}{f_{\mathrm{route},A}}
\frac{f_{\mathrm{process},B}}{f_{\mathrm{process},A}}
\frac{f_{\mathrm{escape},B}}{f_{\mathrm{escape},A}}
\frac{d_A}{d_B}
\frac{w_B(T)}{w_A(T)}.
\]

This equality requires defined denominators. It is a model identity, not evidence that six independent experimental mechanisms have been identified. In particular, w itself depends on the rates and schedule; changing cytosolic removal changes both the retention term and the window term. Multiplicative attribution is not independence.

For the slow-processing example at 24 hours, A has realized 91.25% of its eventual cohort AUC and B only about 17.55%. The entry-and-routing benefit gives B 2.5 times the eventual cohort potential, but its relative window factor is only about 0.1923. Their product is approximately 0.4808. The finite-time reversal is therefore a timing penalty acting on a favorable productive yield, not a contradiction in the calculation.

### Exposure still to come is not material already lost

The future AUC remaining in the current state can be calculated without extending the trajectory. Stop entry at T and give every compartment credit only for its remaining productive probability and cytosolic residence:

\[
Q_{\mathrm{remaining}}(T)
=\frac{
\nu f_{\mathrm{route}}f_{\mathrm{process}}f_{\mathrm{escape}}E(T)
+\nu f_{\mathrm{process}}f_{\mathrm{escape}}L(T)
+f_{\mathrm{escape}}P_{\mathrm{lys}}(T)
+P_{\mathrm{cyt}}(T)}{d}.
\]

Consequently:

\[
Q(T)+Q_{\mathrm{remaining}}(T)=Q_{\mathrm{cohort},\infty}.
\]

This prospective ledger distinguishes a delayed contribution from an irreversibly lost one. Returned ADC and the nonproductive sink receive no future credit because they cannot re-enter this model. For continuous entry, this is a deliberate “stop now” calculation for material that has already entered, not the infinite AUC of indefinite dosing. In pulse mode it is the remaining chase under the existing off schedule.

The software exports each compartment's remaining-AUC contribution and a numerical closure residual. This identity is also checked against the independently time-stepped state ledger. None of these credits asserts that an assay measures intact conjugate or active payload with perfect species specificity.

### Why faster disappearance can accompany worse delivery

In a compartment with productive rate p and loss rate ℓ, the density of a productive exit at waiting time t is p exp[−(p + ℓ)t]. Its integral is p/(p + ℓ). Conditional on that productive exit, the normalized waiting-time density is therefore (p + ℓ) exp[−(p + ℓ)t], with mean 1/(p + ℓ).

This gives a precise selection effect: raising loss reduces the fraction that succeeds while shortening the waiting time among the successful paths. A shorter residence, a faster decline of intact material, or faster arrival among the successful subset cannot alone establish better productive routing.

For an entered unit that eventually reaches the cytosol, the mean entry-to-arrival time in this serial, constant-hazard model is:

\[
\mathbb E[t_{\mathrm{arrival}}\mid\mathrm{success}]
=\frac{1}{a}+\frac{1}{b}+\frac{1}{c}.
\]

This conditional mean excludes the input schedule and the subsequent mean cytosolic residence 1/d. It is not a median, a crossover time or an efficacy onset. If the productive route is blocked, there is no conditional successful-path mean. With zero actual input but an open route, the tagged-unit conditional mean remains mathematically defined.

For slow-processing B without intact loss, this mean is 51 hours. Adding ℓ = 0.2 h⁻¹ shortens it to approximately 5.545 hours, while the productive processing fraction falls from 1 to 1/11. The successful subset becomes faster precisely while the productive population becomes smaller.

### Which kind of processing limitation?

The local elasticity of steady cytosolic arrival to processing, holding entry and every other rate fixed, is:

\[
\frac{\partial\log F_{\mathrm{ss}}}{\partial\log p}
=\frac{\ell}{p+\ell},
\qquad F_{\mathrm{ss}}>0,\ p>0.
\]

When intact loss is zero, faster processing cannot improve steady throughput in this restricted model: everything eventually processes. It can nevertheless improve finite-time AUC by shortening the queue. When intact loss competes, faster processing can improve both productive yield and timing. “Processing-limited” therefore needs an endpoint and a time horizon, not just a slow rate.

The UI reports this local steady elasticity, not a finite-time sensitivity, an uncertainty estimate or a global bottleneck ranking. A hypothetical independent change of p need not correspond to an experimentally selective perturbation. The supplied model explores such a counterfactual; it does not establish that an intervention can implement it.

## Equal AUC, different exposure histories

An integral can be an excellent summary and a poor substitute for the thing it summarizes. Revision delivery-7 makes that distinction executable: it matches the finite-window cytosolic AUC while retaining different processing rates, then asks which aspects of the exposure history have not been matched. The comparison is constructed, not discovered in experimental data.

### Match the area without concealing the intervention

Write \(P_i(t)\) for cytosolic payload amount in case \(i\), and \(Q_i(T)=\int_0^T P_i(t)\,dt\). All initial amounts are zero, rates are constant and input amplitude enters linearly. Holding B's other inputs and the shared schedule fixed therefore permits an explicit normalization:

\[
J_B^\star=\frac{Q_A(T)}{Q_B(T;J_B=1)}.
\]

The denominator is the response to a unit entry flux, not a unit extracellular dose. This changes B's entered amount, every B stock and every B flux proportionally. It does not change B's routing fractions, processing rate, competing-loss rate, escape rate, cytosolic removal or normalized exposure shape. Zero reference exposure, a blocked productive route and a required entry exceeding the supported range cannot produce a supported positive-AUC match.

The app never silently rematches after an edit. Changing the horizon can destroy the equality because the two cases accumulate different fractions of their lifetime exposure by that time. The user must choose whether to preserve the original intervention or explicitly construct a new equal-area comparison. Neither operation is an equipotent-dose calculation.

### A deliberately revealing example

The seventh preset uses a 2-hour entry pulse and a 24-hour observation window. A retains the default rates and entry of 100 ADC/cell/h. B retains the default favorable routing but processes at 0.05 h⁻¹; both intact-loss rates remain zero. The normalization sets B entry to approximately 30.805226 ADC/cell/h. All values are synthetic.

Both 0–24-hour AUCs are approximately 10 payload·h/cell. Yet A peaks at approximately 3.3846 payload/cell at 2.6252 hours, while B peaks at only 0.6412 payload/cell at 5.6482 hours. Half of A's finite-window exposure has accumulated by 2.9109 hours; B reaches that point at 10.8961 hours. The central 80% exposure interval spans 3.3175 hours for A and 16.4156 hours for B.

This is also not a lifetime-exposure match. The entered cohorts' eventual AUCs are 10 for A and approximately 15.4026 payload·h/cell for B. The remaining B tail is part of the explanation for the 24-hour match, not an accounting error. In this example, roughly 18.90% of B's observed AUC occurs during hours 18–24, compared with approximately 0.0000216% of A's.

### Define timing without inventing pharmacology

For positive finite-window AUC, define the area-normalized profile and its cumulative integral:

\[
g_i(t)=\frac{P_i(t)}{Q_i(T)},\qquad
G_i(t)=\frac{Q_i(t)}{Q_i(T)},\qquad
\int_0^T g_i(t)\,dt=1.
\]

\(g_i\) has units h⁻¹; \(G_i\) is dimensionless. They describe when exposure accumulates, not the fraction of ADC molecules delivered, cells affected or target occupied. The right-hand plot normalizes each case separately even when their areas differ; the adjacent verdict states whether those areas are actually equal.

The exposure quantile \(t_q\) solves \(G_i(t_q)=q\). The reported \(t_{10}\), \(t_{50}\) and \(t_{90}\) are thus neither onset times nor potency percentiles. The central interval \(t_{90}-t_{10}\) contains 80% of the selected window's AUC, not necessarily 80% of lifetime exposure. A second timing descriptor is the exposure-weighted mean clock time:

\[
\bar t_i=\frac{\int_0^T tP_i(t)\,dt}{Q_i(T)}.
\]

Its values in the example are approximately 3.1000 hours for A and 11.6545 hours for B. This mean differs from \(t_{50}\), just as a distribution's mean need not equal its median. To calculate the numerator without coarse-grid quadrature, the ODE solver includes an auxiliary accumulator \(H_i'=Q_i\), giving \(\int_0^T tP_i(t)\,dt=TQ_i(T)-H_i(T)\) by integration by parts. This adds bookkeeping, not a biological compartment.

Peak amount is the maximum within the observation window. Under continuous input and zero initial conditions it occurs at the boundary; the interface labels that explicitly rather than declaring that a global peak was observed. Under a single rectangular pulse, the positive serial first-order cascade is unimodal, permitting refinement of the interior maximum where cytosolic arrival equals removal:

\[
k_{\mathrm{esc}}P_{\mathrm{lys}}(t_{\max})
=k_{\mathrm{cyt}}P_{\mathrm{cyt}}(t_{\max}).
\]

These roots and exposure quantiles use matrix-exponential state evaluations and bisection, rather than selecting the largest of 401 plotting nodes. The plot includes the refined peak and additional neighboring samples. A deliberately narrow-pulse test verifies that a peak lying between reported nodes is not missed.

### The cutoff can reverse the descriptive ranking

For a user-selected amount cutoff \(c\), the reported duration is

\[
D_i(c;T)=\int_0^T \mathbf{1}\{P_i(t)>c\}\,dt.
\]

At \(c=1\) payload/cell, A spends approximately 3.6932 hours above the cutoff and B never exceeds it. At \(c=0.5\), A spends 4.7579 hours above it, while B spends 8.2264 hours. The duration ranking reverses without changing either exposure profile or either AUC. At still lower cutoffs, B can remain above the cutoff when observation ends; its within-window duration is then explicitly truncated.

The cutoff is an arbitrary descriptive device. There is no measured activity threshold in this example, and none is inferred by moving the control. Durations use strict inequality; zero exposure produces zero duration and undefined normalized timing rather than fabricated quantiles.

### State the missing biological question

Equal AUC would imply equal values of a deliberately chosen summary \(E_i=\alpha\int_0^T P_i(t)\,dt\), provided the same constant \(\alpha\), window and species mapping apply. That is a property of the assumed response summary, not a theorem that this summary describes efficacy. A time-weighted quantity \(\int_0^T w(t)P_i(t)\,dt\), or a nonlinear quantity \(\int_0^T f(P_i(t))\,dt\), need not agree at equal unweighted AUC.

This is the useful boundary of the exposure audit. It exposes the differences that an effect model would have to explain without choosing that model by implication. Its outputs cannot identify engagement, turnover, saturation, damage, repair or cell-state timing. The optional PD layer makes some of these hypotheses explicit and editable, not inferred. Amount per cell is also not a concentration without a justified compartment-volume conversion. No response ranking across payloads, constructs or formats follows from this synthetic comparison.

For experimental planning, the contrasting peaks and \(t_{10}\)–\(t_{90}\) intervals identify candidate regions for denser time sampling and a longer chase. They are not validated sampling schedules or an optimal-design calculation: measurement noise, detectability, biological heterogeneity and parameter uncertainty are not represented. The practical question becomes what time-resolved, species-specific observation could distinguish the proposed histories, rather than which single area would make them appear interchangeable.

## What this can and cannot say about ADC format

A bispecific or alternative-format ADC enters this model only through experimentally supported input and kinetic assumptions. There is no parameter called “bispecific advantage.” A change in architecture cannot be translated into a favorable routing rate merely because that explanation would make the result attractive.

The paired-antigen audit addresses a different layer: the joint expression distribution. This kinetic companion starts after entry is prescribed. Joint binding, avidity, geometry, receptor trafficking, co-internalization and their dependence on antigen density are not calculated here. Linking the tools requires measurements or a separately specified binding-and-entry model, not a shortcut from double-positive cells to productive delivery.

Nor is AUC a universal efficacy currency. Equal amounts integrated over time can have different time profiles; the transport equations contain no process with which to decide whether those profiles are pharmacodynamically interchangeable. The optional layer supplies hypothetical engagement and an arbitrary formation–recovery signal, not a validated damage, repair or killing model. Cross-payload comparisons would additionally require a justified mapping between molecular exposure and effect.

All rates are constant and the cases are homogeneous. Applying nonlinear rate fractions to mean cellular parameters generally need not reproduce the mean output of a heterogeneous population. The single-cell antigen audit does not repair that missing kinetic heterogeneity. These limitations locate the next measurements and extensions; they are not reasons to hide the assumptions in a more elaborate diagram.

## What an assay would need to distinguish

I would seek observables that distinguish entry, intact intracellular conjugate, released payload species and cytosolic availability across time, rather than use a single accumulated signal to fit every rate. Cellular processing work by Maass and colleagues demonstrates experimentally parameterized separation of several such steps while also exposing the limitations of fluorescent proxies; the staged calibration in Scheuher and colleagues provides a broader example of keeping different observables attached to different model components. ([Maass et al., 2016](https://dspace.mit.edu/bitstream/handle/1721.1/103801/12248_2016_9892_ReferencePDF.pdf?sequence=1&isAllowed=y), [Scheuher et al., 2024, online 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC11576657/))

A proposed assay-design workflow is:

- **Constrain entry:** distinguish surface-associated from internalized material and state what the labeled species actually reports.
- **Challenge routing:** use time-resolved retention and return measurements rather than treating intracellular accumulation as lysosomal commitment.
- **Separate species:** distinguish intact conjugate and released species, with controls for proxy behavior and compartment attribution.
- **Challenge time dependence:** compare continued input with a characterized pulse–chase experiment, recognizing that external washout and cessation of internalization need not coincide.
- **Test identifiability:** ask whether competing rate combinations fit the same endpoint, then choose a second measurement that separates them.

This is a proposed experimental reasoning workflow, not a validated assay protocol. The exact measurement method and perturbation controls must be chosen for the actual molecule, payload, cell system and causal claim.

## Numerical method and reproducibility

Both cases use fourth-order Runge–Kutta integration with a maximum step of 0.025 divided by the fastest compartment exit rate, additionally bounded by the reported output interval. The solver splits a step exactly at pulse cessation. Each case reports 401 equally spaced time points; its internal solver steps are finer when required.

Inputs are bounded: J from 0 to 10⁶ ADC/cell/h; routing, processing, escape and both lysosomal loss rates from 0 to 10 h⁻¹; cytosolic removal from 0.001 to 10 h⁻¹; ν from 1 to 16; observation from 0.25 to 168 h. Endosomal and released-lysosomal exit-rate sums must be positive. Processing plus intact-lysosomal loss must be at least 0.001 h⁻¹; processing may be zero when competing loss supplies a sufficient exit. These are numerical exploration limits, not biological plausibility ranges.

The verification suite checks conservation, nonnegative finite trajectories, constant-input steady limits, the matched-routing control, blocked routes, zero input, yield scaling, pulse-boundary accounting, a smaller-step convergence comparison and generated-worker agreement. It also checks full-trace equality and hidden-state differences in the fifth case under continuous and pulse inputs, the factorization and break-even threshold, and safeguards around the limited structural-match check. Passing these checks establishes implementation consistency, not therapeutic validity.

JSON exports parameters, all state trajectories, solver metadata, units, reference calculations, reasoning factors, break-even information, both processing-versus-loss maps, the sufficient structural-match check and limitations. The trajectory CSV contains 802 rows plus a header, one case/time combination per row; each map has a separate grid CSV. The trajectory PNG summarizes the original four plots; the candidate-readout trace is available in the full numerical exports. Retain JSON alongside a PNG for parameter provenance.

Revision delivery-7 adds `profileAudit` to the same schema and `firstMoment` to each trajectory row. The audit retains window-specific descriptors, refined curves, the match calculation, numerical matching tolerance and live descriptive-cutoff settings. A separate profile CSV exports exact-evaluation times and amounts, fluxes, cumulative AUC and both normalizations; its row count varies with the added peak and quantile times. Its PNG displays the two curves, window, ratio and cutoff, but full JSON remains necessary for all kinetic parameters. Invalid cutoff input clears that result rather than exporting a stale value; a new model run resets the descriptive cutoff to 1 payload/cell.

The numerical match criterion is \(|Q_B/Q_A-1|\leq10^{-8}\) with positive \(Q_A\); it is not an experimental equivalence margin. Tests compare matrix-exponential amounts, arrival fluxes and AUCs against independent RK4 trajectories using the established \(10^{-7}\) mixed absolute/relative tolerance. For a cascade with four equal exit rates \(k\) and pulse width \(\tau\), the interior peak also has the independent analytical solution \(t_{\max}=\tau/[1-\exp(-k\tau/3)]\). Additional checks cover exposure quantiles, centroid versus independent quadrature, cutoff crossings and ranking reversal, horizon-dependent matching, zero routes and exports.

The export schema is `productive-delivery/0.2`. Each parameter set requires `lossIntact`; the model does not silently assign a value to older incomplete input objects. The browser has no report-import feature. The five earlier presets explicitly set this rate to zero, preserving their trajectories. New fields include `intactLoss`, `intactLossFlux`, `processingFlux`, steady `fProcess` and `lysosomalResidence`; the transfer signature uses the total intact-lysosomal exit rate.

## Boundary and references

The transport core does not compute binding kinetics or target occupancy. The optional PD hypothesis computes a fixed-pool engagement fraction and an arbitrary downstream signal, under a one-way, nondepleting free-payload assumption. Neither layer computes receptor abundance, spatial transport, bystander effect, proliferation, cell death, resistance, systemic PK or therapeutic index. The coexpression audit and this kinetic example remain separate: the software does not turn an expression quadrant into an inferred routing rate.

Maass KF, Kulkarni C, Betts AM, Wittrup KD. Determination of Cellular Processing Rates for a Trastuzumab-Maytansinoid Antibody-Drug Conjugate (ADC) Highlights Key Parameters for ADC Design. AAPS Journal. 2016;18:635–646. DOI: 10.1208/s12248-016-9892-3. [Full manuscript](https://dspace.mit.edu/bitstream/handle/1721.1/103801/12248_2016_9892_ReferencePDF.pdf?sequence=1&isAllowed=y).

Scheuher B, Ghusinga KR, McGirr K, Nowak M, Panday S, Apgar J, Subramanian K, Betts A. Towards a platform quantitative systems pharmacology (QSP) model for preclinical to clinical translation of antibody drug conjugates (ADCs). Journal of Pharmacokinetics and Pharmacodynamics. 2024;51:429–447; online 2023. DOI: 10.1007/s10928-023-09884-6. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC11576657/).

These publications motivate the scientific distinctions but supply none of the example's numerical parameter values. The equations, implementation and schematic are original generic constructions; no product-specific sequence, fitted parameter set or third-party code has been imported.
