# Equal AUC, different pharmacodynamic consequences

## A hypothesis layer, not an efficacy calculator

This opt-in extension asks which additional assumptions make two delivery profiles pharmacodynamically distinguishable. It takes the existing four-compartment delivery histories and applies the same hypothetical PD parameters to both cases. It does not fit those parameters, change either delivery trajectory, or predict viability, tumor response or therapeutic benefit. Published in repository release v0.2.0-alpha; historical delivery component version 0.2.6-example; delivery revision delivery-9; PD revision pd-2.

The scientific motivation is specific. Equilibrium affinity does not specify the time course of target engagement; association and dissociation kinetics can matter when exposure changes. That distinction is discussed in [Vauquelin, 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4945762/). Response production and dissipation can also generate delays and recovery that should not be mistaken for an instantaneous concentration–effect relationship, as developed in [Dayneka, Garg and Jusko, 1993](https://link.springer.com/article/10.1007/BF01061691).

These publications motivate distinctions, not parameter values. All numbers here are invented. The implementation does not reproduce either paper's complete model, import third-party code, or represent a named target, therapeutic molecule or proprietary format.

## From accessible payload to engagement

Let \(P(t)\) be the transport model's assumed free, target-accessible cytosolic payload amount, in payload molecules per cell. Let \(O(t)\) be the fraction of a fixed target pool that is engaged, initially zero. Define:

\[
\frac{dO}{dt}=b\left[\frac{P(t)}{K}(1-O)-O\right],
\qquad O(0)=0.
\]

Here \(K\) is an effective amount scale in payload/cell, and \(b\) is effective disengagement in h⁻¹. Effective association in amount coordinates is \(a=b/K\), in (payload/cell)⁻¹h⁻¹. For constant \(P\),

\[
O_{\mathrm{eq}}=\frac{P}{K+P},\qquad
\tau_O=\frac{1}{b(1+P/K)}.
\]

At fixed \(K\), changing \(b\) changes both association and disengagement. It changes the speed of equilibration while preserving the equilibrium curve; it is not an isolated change in off-rate or affinity. With no free payload, engagement decays with half-time \(\ln 2/b\).

The units are intentional. \(K\) is neither a molar dissociation constant nor an experimentally fitted EC50. For a genuinely uniform accessible volume \(V\), molecular count \(P\), and reversible binding without extra losses, \(C=P/(N_A V)\) and \(K_{\mathrm{amount}}=K_{d,\mathrm{molar}}N_A V\). The app supplies neither a validated volume nor the species/accessibility mapping needed to use this conversion. Compartment-average total payload cannot silently stand in for free payload at its molecular target.

The one-way assumption is consequential: binding does not deplete \(P\), alter its clearance, or feed back into trafficking. Target abundance is not supplied, so the model cannot verify whether sequestration is negligible. Interpreting \(b\) as including engaged-target replacement additionally requires a constant target pool replenished unengaged; turnover is not separately estimated. The deterministic fractions can also be questionable at very small molecule or target counts.

## From engagement to a recoverable downstream signal

Let \(D(t)\) be a hypothetical excess downstream signal above an unmodeled baseline:

\[
\frac{dD}{dt}=sO-rD,\qquad D(0)=0.
\]

The formation scale \(s\) is in arbitrary units/h; the recovery rate \(r\) is in h⁻¹. The result is in arbitrary units, not lesions, dead cells, fractional viability or tumor volume. Calling \(r\) “repair” in code does not establish a DNA-repair mechanism. Recovery has half-time \(\ln 2/r\); \(r=0\) means no recovery.

The endpoint is a weighted history:

\[
D(T)=s\int_0^T e^{-r(T-t)}O(t)\,dt.
\]

Recent engagement is retained more strongly than earlier engagement when \(r>0\). Equal engagement area alone therefore need not imply equal endpoint signal. Conversely, a larger endpoint need not imply a larger peak signal.

The recovered-signal ledger is \(R'(t)=rD(t)\), with \(R(0)=0\). Integration gives an exact accounting identity:

\[
D(T)+R(T)=s\int_0^T O(t)\,dt.
\]

The exported retained fraction is \(D(T)/(s\int O\,dt)\), undefined when no signal was formed. This is a bookkeeping fraction, not a surviving-cell fraction.

## Three controls isolate three assumptions

The same exposure histories drive three nested comparisons. None is fitted by choosing the most appealing ranking.

- **Linear exposure control:** replace \(O\) by \(P/K\). Without recovery, \(D_{\mathrm{lin},0}(T)=sQ(T)/K\), where \(Q=\int P\,dt\). Equal AUC must give equal values under common \(s,K,T\). With recovery, \(D_{\mathrm{lin}}(T)=(s/K)\int e^{-r(T-t)}P(t)\,dt\); even a linear response can distinguish equal unweighted AUCs.
- **Instantaneous saturation control:** use \(O_{\mathrm{eq}}(t)=P(t)/(K+P(t))\), both as an area and as the drive for \(D_{\mathrm{eq}}'=sO_{\mathrm{eq}}-rD_{\mathrm{eq}}\). This adds saturation but assumes infinitely fast equilibration.
- **Kinetic engagement hypothesis:** solve the engagement ODE and drive \(D\) with \(O(t)\). This adds finite engagement kinetics before downstream recovery.

The saturating function is concave. At a fixed observation duration and fixed mean amount, Jensen's inequality bounds its integrated value from above by the constant-profile case. Equal AUC alone, however, does not order arbitrary time profiles; do not generalize one pulse comparison into a rule that every broader profile is better.

## Worked example: the endpoint is not the peak

Load “Equal AUC, different histories” in the delivery model. Its 2-hour prescribed entry pulse and 24-hour observation window give both cases approximately 10 payload·h/cell. A peaks near 3.385 payload/cell; B peaks near 0.641. The matching adjusts B's entry amplitude, not its kinetics.

For the default PD hypothesis \(K=0.5\), \(b=1\), \(s=1\), \(r=0.2\):

| Observable | A | B |
|---|---:|---:|
| Linear no-recovery control, AU | 20.000 | 20.000 |
| Integrated kinetic engagement, h | 4.719 | 10.154 |
| Peak downstream signal, AU | 2.330 | 2.317 |
| Time of peak downstream signal, h | 6.230 | 15.153 |
| Downstream signal at 24 h, AU | 0.1006 | 2.0348 |
| Fraction of formed signal retained at 24 h | 0.0213 | 0.2004 |

B has approximately 2.152 times the integrated engagement and 20.218 times the endpoint signal, yet the two peak signals are nearly equal. The endpoint ratio describes a particular clock time under a particular recovery assumption. Calling it a twentyfold improvement in maximal effect would misread the model; calling it a twentyfold improvement in efficacy would invent a biological mapping the model does not contain.

Now load “Slow engagement, same K.” It changes \(b\) from 1 to 0.02 h⁻¹ while retaining \(K=0.5\). The instantaneous saturation-area ratio remains approximately 2.3255, because the equilibrium curve is unchanged. But B/A integrated kinetic engagement becomes approximately **0.6576**, and B/A endpoint signal becomes approximately **0.9870**. The engagement ranking reverses at identical exposure AUC and identical equilibrium scale.

Finally, “No signal recovery” makes the endpoint equal to accumulated signal formation: \(D(T)=s\int O\,dt\). “Fast signal recovery” can produce a very large endpoint ratio when A has almost returned to zero. The interface retains the absolute values and peak values beside that ratio; a small denominator is not evidence of exceptional therapeutic potency.

## What would make the hypothesis informative experimentally?

### An endpoint ratio deserves an explanation

Define \(I_{\mathrm{eq}}=\int_0^T O_{\mathrm{eq}}dt\), \(I=\int_0^T Odt\), and \(Q=\int_0^T Pdt\). For positive denominators, introduce three dimensionless accounting terms:

\[
C=\frac{K I_{\mathrm{eq}}}{Q},\qquad
M=\frac{I}{I_{\mathrm{eq}}},\qquad
R=\frac{D(T)}{sI}.
\]

Then

\[
D(T)=\frac{s}{K}\,Q\,C\,M\,R.
\]

Under shared \(s,K\), the B/A endpoint ratio is exactly the product of the B/A ratios for \(Q,C,M,R\). This is a telescoping identity within the stated model, not a causal attribution method. The factors depend on one another; none is independently identified by observing the endpoint. Undefined normalizations remain null.

\(C\) quantifies compression by the instantaneous saturation reference relative to the linear exposure drive. \(M\) compares integrated kinetic engagement with that instantaneous reference; it can exceed one because engagement can persist after the reference falls. \(R\) is the fraction of formed signal retained at the endpoint. Only \(C\) and \(R\) are bounded fractions. Calling \(M\) an efficiency would confuse a history-dependent comparison with a probability.

For the default equal-AUC case, the endpoint ratio is approximately \(1\times2.3255\times0.9254\times9.3955\approx20.2183\), with the small discrepancy from rounded factors removed at full precision. Much of the large endpoint ratio is associated with differential retention of formed signal, not greater peak response. This does not establish recovery as an experimentally identified cause: the identity inherits every assumption used to generate the histories.

The common formation scale \(s\) cancels from the comparison. Increasing it can make both plotted signals larger without adding information about their relative ranking. This is why the model reports arbitrary units rather than giving the scaling parameter the appearance of a validated killing coefficient.

### Engagement memory does not create exposure

Integrating the engagement equation from zero initial engagement yields

\[
Q=K I+\frac{K}{b}O(T)+\int_0^T P(t)O(t)\,dt.
\]

All terms are in payload·h/cell. The second term is the residual engagement boundary contribution. The third is exposure coinciding with occupied targets, which are unavailable for new association in the declared fixed-pool model. It is not a statement that those molecules are therapeutically wasted.

Since all terms are nonnegative, \(I\le Q/K\). Thus integrated kinetic engagement may exceed the instantaneous saturation reference, while still remaining bounded by the unsaturated linear exposure drive. Finite-window residual engagement matters: it cannot be dropped as though the system had fully relaxed.

The UI computes the overlap term by subtraction and labels it accordingly. That displayed identity is not an independent solver validation. The test suite separately integrates \(PO\) by quadrature to check consistency.

### The assay clock is an experimental choice

In the default example, the downstream-signal ordering reverses between the reported times 8.70 and 8.76 hours: A is larger before this bracket, B afterward at the adjacent reporting nodes. No parameters change. The profiles were matched on 24-hour AUC; they were not matched on every earlier partial AUC.

The interface scans the 401 reported time points and lets the reader inspect the first sampled reversal. It does not claim an exact root or an exhaustive crossing search. Sign comparisons use \(10^{-8}\) times the larger within-window signal peak as a numerical tolerance, not a detection limit, equivalence margin or activity threshold. Short reversals between reporting nodes may be missed. No detected reversal is not proof that none exists.

### Three proposed discrimination tests

- **Saturation:** measure engagement against target-accessible free amount on rising and falling limbs. Ask whether one instantaneous curve can describe both. Equal nominal dose or total intracellular payload is not the species-specific exposure constraint used by this model.
- **Engagement memory:** challenge that instantaneous curve with paired measurements at similar free amount but different exposure history. A loop would reject a single-valued instantaneous mapping under stable conditions, but would not uniquely identify binding kinetics; delayed access, changing target pools and population mixtures remain alternative hypotheses.
- **Recovery:** test the downstream tail only after engagement is shown to be negligible. Under the declared equation, the remaining signal then decays exponentially at rate \(r\). A downstream trace alone cannot distinguish sustained formation from slow recovery. Cessation of external dosing does not set the intracellular states to zero in these equations.

A useful comparison would constrain the accessible payload species over time, measure target engagement across the rising and falling portions of exposure, and observe an appropriate downstream readout during both exposure and recovery. The proposal is to challenge competing explanations, not to assign one endpoint to every unknown rate.

In this model, \(K\) and \(b\) jointly determine engagement dynamics. A limited exposure range or a single endpoint may constrain neither well. Separately estimating \(s\) and \(r\) from a downstream endpoint is also generally underdetermined. The preview does not perform fitting, uncertainty propagation, formal identifiability analysis or optimal sampling design.

ADC format enters only through the separately justified delivery history. No bispecificity multiplier, avidity benefit or receptor-sorting advantage is invented. Irreversible engagement, covalent lesions, target renewal, repair saturation, cell-cycle dependence, bystander transfer, heterogeneous cell states, death thresholds and proliferative recovery require additional models and evidence. A biological label on \(D\) would not supply that evidence.

## Numerical implementation and audit trail

The PD worker reintegrates the four transport states together with engagement, three downstream controls and integral ledgers using RK4. It does not interpolate the 401-point displayed delivery trace. Input switching is split exactly at pulse cessation. Both cases use identical PD assumptions and zero initial engagement/signal.

The maximum internal step is the smaller of the output interval and 0.025 divided by the fastest transport exit, recovery rate, or \(b(1+P_{\max}/K)\), using the delivery profile's refined within-window peak. Reported curves contain 401 evenly spaced samples; peak engagement and signal are maxima over internal integration steps, not analytically optimized peaks. Peak times are consequently step-resolved. A peak at the window end does not establish the later global maximum.

The worker checks finite nonnegative states, engagement bounded by one, and closure of the formation/recovery ledger. Extreme supported input combinations can exceed a 500,000-step budget; those combinations are rejected explicitly rather than silently approximated. Controls have numerical bounds, not biological plausibility ranges.

Before calculation, the user must acknowledge the one-way free-amount assumption. Editing a PD field clears only the PD result; editing a delivery input invalidates both. Loading a new hypothesis preserves delivery inputs but does not calculate automatically. Cancellation discards the unfinished PD result while retaining the delivery comparison.

The PD JSON uses schema `hypothetical-pd/0.1` and contains delivery inputs, PD inputs, trajectories, control results, diagnostics, units and assumptions. The full delivery JSON also includes the optional `pharmacodynamics` object, or `null` if not calculated or invalidated. The PD CSV has 802 data rows, a header and three metadata lines; retain JSON for the full audit trail. The PNG pairs engagement and downstream-signal curves with parameter and scope labels. All four time inspectors use the same node.

## Published references and scope of use

Vauquelin G. Effects of target binding kinetics on in vivo drug efficacy: koff, kon and rebinding. British Journal of Pharmacology. 2016;173:2319–2334. DOI: 10.1111/bph.13504. Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC4945762/. Used for the equilibrium-versus-kinetic distinction; this implementation does not model local rebinding.

Dayneka NL, Garg V, Jusko WJ. Comparison of four basic models of indirect pharmacodynamic responses. Journal of Pharmacokinetics and Biopharmaceutics. 1993;21:457–478. DOI: 10.1007/BF01061691. Publisher record: https://link.springer.com/article/10.1007/BF01061691. Used for the distinction between response production and dissipation; the present zero-baseline excess-signal model does not reproduce the paper's four indirect-response models.

This is an original generic hypothesis implementation with synthetic parameters. Source selection and generic scope are not a legal opinion or a freedom-to-operate determination.
