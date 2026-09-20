# Beyond expression: mechanistic models worth building on

## Antigen-tail Check · 99 Small Problems

Prepared September 19, 2026. Refined scientific rationale and focused reading guide for bispecific and alternative-format ADC modeling. This is not a systematic review, and it does not assume that a model transfers across therapeutic formats simply because both constructs carry a payload.

I would build this tool around one question: **has the comparison preserved the biological information needed to support its interpretation?** Its value is not another expression plot, and certainly not an efficacy score with more decimal places. It is a reproducible way to identify which part of a proposed mechanistic comparison the measurements actually constrain.

## What makes the small problem worth solving

“Expression-matched” needs an object: matched means, matched marginal distributions, matched same-cell joint distributions, or matched functional engagement? These are different statements. The first three are statistical descriptions; the fourth already requires a physical model and additional observations.

Consider the app's invented example. Population A contains 50% double-high cells and 50% double-zero cells; population B contains 50% X-only and 50% Y-only cells, with the same high values. Every separate X or Y histogram is identical between A and B, yet their double-high fractions are 50% and 0%, and their either-high fractions are 50% and 100%.

The important result is not that A is better. A ranks higher under a strictly joint-required rule, B under an either-sufficient rule, and both tie under an additive rule with matched marginal contributions. The example therefore exposes two distinct gaps: missing information about pairing, and missing knowledge of the response mechanism. Solving the first does not quietly solve the second.

That is the tool's defensible niche. It can challenge a claim that two populations are interchangeable under a stated comparison, quantify the uncertainty left by unpaired measurements, and show whether the conclusion survives plausible cutoffs. It cannot establish biological equivalence, demonstrate a therapeutic advantage, or identify an ADC's mechanism from an expression distribution.

## The mathematical reason pairing sometimes matters

For a specified cell-autonomous endpoint at fixed exposure and time, write its population expectation schematically as:

\[
\bar m=\int m(x,y,z;d,t,\theta)\,p(x,y,z)\,dx\,dy\,dz.
\]

Here x and y are the supplied expression variables, z represents other cellular states, d and t specify exposure and observation time, and θ contains the proposed mechanistic parameters. This is an organizing identity, not a fitted response model. The audit describes the supplied empirical X/Y distribution; it does not identify the function m or the omitted states z, and intercellular transfer would require an expanded spatial or population formulation.

There is an important counterargument to the claim that joint data are always essential. If the relevant response is exactly additive, m(x,y) = a(x) + b(y), its expectation depends only on the two marginals. Rearranging the same X and Y values among cells then changes nothing. Pairing becomes potentially consequential when the response contains a nonseparable interaction; even then, not every change in joint distribution must change every response.

The app's hypothetical product score makes this distinction exact:

\[
\mathbb E[uv]-u(\mathbb E[X])v(\mathbb E[Y])
=\operatorname{Cov}(u,v)
+\left\{\mathbb E[u]\mathbb E[v]-u(\mathbb E[X])v(\mathbb E[Y])\right\}.
\]

The covariance term isolates the effect of same-cell association for these chosen transformations. The bracketed term captures what nonlinear transformation of the marginal distributions adds beyond transforming their means. This is not raw X/Y correlation, and neither term is a measured efficacy effect.

For the alternative score u + v − uv, the pairing contribution has the opposite sign. Thus identical input data can support opposite score rankings under different declared response assumptions. Calling the construct “bispecific” does not choose one of these equations.

Without paired observations, the overlap is only partially identified:

\[
\max(0,p_X+p_Y-1)\leq p_{XY}\leq\min(p_X,p_Y).
\]

At pX = pY = 0.5, double-high occupancy can lie anywhere from 0 to 0.5. Acquiring more unpaired events may estimate the marginal fractions more precisely, but it cannot remove that structural ambiguity. These are feasible overlap bounds conditional on the supplied marginals, not confidence intervals.

## A format name is not a response function

For a dual-antigen construct intended to bind two receptors on one cell, joint expression is relevant to the availability of same-cell receptor combinations, but productive dual engagement still depends on binding kinetics and the physical constraints represented, explicitly or implicitly, in a binding model. Ray and colleagues illustrate the distinction by representing binary and ternary complexes separately rather than substituting “double-positive” for “dual-engaged.” ([Ray et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11189202/))

For our audit, I would therefore distinguish three proposed use cases rather than impose a format-to-equation lookup. A same-cell co-engagement hypothesis asks about paired abundance; an either-target capture hypothesis asks about coverage and route-specific delivery; a cross-cell targeting hypothesis additionally asks which cell bears each target and whether the relevant cells can interact. The current input does not answer the latter spatial question.

Likewise, two epitopes on one receptor should not be relabeled as two independent antigen axes merely to fit this interface. My inclusion rule would be explicit: use the paired audit when X and Y are independently interpretable measured quantities whose joint distribution is relevant to the stated hypothesis; otherwise use a different observation model.

Payload transfer creates a further distinction between the cell capturing an ADC and a cell ultimately exposed to released payload, while tissue transport can separate antigen-bearing cells from cells reached by sufficient drug. Published spatial and heterogeneous-population models make these additional variables explicit; expression quadrants alone do not. ([Khera et al.](https://pubs.rsc.org/en/content/articlehtml/2018/me/c7me00093f), [Singh et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7318793/))

The appropriate ambition is therefore not “predict all ADC formats.” It is “state exactly which comparison this format-specific hypothesis requires, then expose what was not measured.”

## What should change after using the tool

I would judge the audit by a changed inference or a better-chosen experiment, not by the number of panels it can generate. The following are proposed decision rules, not automated biological diagnoses:

- **Matched marginals, different pairing:** stop attributing an outcome difference solely to intrinsic construct activity on the grounds that the populations were expression-matched. Measure functional engagement in the relevant subpopulations before choosing that explanation; the audit has exposed an alternative, not proven it.
- **Wide overlap bounds from separate measurements:** acquire same-cell measurements if the stated mechanism depends on coexistence. Another large unpaired dataset does not identify the missing pairing.
- **A conclusion that changes across cutoffs:** investigate calibration and the purpose of the cutoff before promoting one quadrant fraction into a mechanistic threshold. Sensitivity to a cutoff is a property of the analysis, not evidence that a biological switch exists there.
- **Comparable expression but different activity:** do not ask the expression audit to adjudicate downstream causes. Use the evidence panel to identify an untested distinction among engagement, processing, active payload exposure and susceptibility.
- **A conclusion unchanged by the full audit:** retain the simpler description for that particular decision. The model has earned its place by showing when its added complexity does not matter.

The evidence panel earns its place only if each entry is interpreted in context. A measured quantity must retain its molecular species, compartment, dose, time, normalization, cell identity and controls; a status label alone cannot identify a rate or establish the causal step that produced it. Maass's processing experiments and Scheuher's staged calibration illustrate why separate observables are more informative than treating one accumulated signal as the entire delivery chain. ([Maass et al.](https://dspace.mit.edu/bitstream/handle/1721.1/103801/12248_2016_9892_ReferencePDF.pdf?sequence=1&isAllowed=y), [Scheuher et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11576657/))

There is also a boundary before the biology. As an illustrative measurement model, if Xobserved = Xtrue + εX and Yobserved = Ytrue + εY, with errors independent of the true signals but correlated with each other, observed covariance equals biological covariance plus Cov(εX, εY). This mathematical possibility is sufficient to show why a joint pattern cannot certify its own measurement quality. The present app records measurement declarations but neither estimates nor corrects an error model.

## How the literature fits together

The papers below answer different missing questions: Ray addresses engagement states; Maass intracellular processing; Khera spatial transport; Singh population-specific exposure and killing; Scheuher cross-scale integration. Their coherence lies in the sequence of unresolved questions, not in a claim that their parameter sets can be assembled into one validated universal ADC model. ([Ray et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11189202/), [Maass et al.](https://dspace.mit.edu/bitstream/handle/1721.1/103801/12248_2016_9892_ReferencePDF.pdf?sequence=1&isAllowed=y), [Khera et al.](https://pubs.rsc.org/en/content/articlehtml/2018/me/c7me00093f), [Singh et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7318793/), [Scheuher et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11576657/))

## The core papers

### Maass et al.: an assay should identify a rate, not merely produce a curve

**Citation:** Maass KF, Kulkarni C, Betts AM, Wittrup KD. Determination of Cellular Processing Rates for a Trastuzumab-Maytansinoid Antibody-Drug Conjugate (ADC) Highlights Key Parameters for ADC Design. AAPS Journal. 2016;18:635–646. DOI: 10.1208/s12248-016-9892-3. [Full author manuscript](https://dspace.mit.edu/bitstream/handle/1721.1/103801/12248_2016_9892_ReferencePDF.pdf?sequence=1&isAllowed=y).

The model separates extracellular ADC, free receptor, surface complex, internalized intact ADC, degraded products and cell growth, with an additional treatment of payload binding to tubulin. Its particular strength is the experimental work used to constrain binding, net internalization, degradation and efflux instead of asking a viability curve to identify all of them simultaneously. ([Maass et al.](https://dspace.mit.edu/bitstream/handle/1721.1/103801/12248_2016_9892_ReferencePDF.pdf?sequence=1&isAllowed=y))

For our tool, I borrow the question structure: can two expression-matched populations differ because material arrives at, accumulates in, or leaves intracellular compartments at different rates? The separate [productive-delivery worked example](productive-delivery.html) now reports those quantities separately rather than summarize them as “internalization.” Its inputs are invented; it is not a reproduction or validation of the published model.

**Evidence strength and caveat:** The study includes independent experimental repeats for processing measurements, but these are not an external validation of the complete mechanistic model. Net internalization already incorporates rapid recycling; fluorescent degradation products proxy aspects of payload handling, and endolysosomal escape is not separately resolved, so its parameter estimates should not be transplanted into another linker–payload system. ([Maass et al.](https://dspace.mit.edu/bitstream/handle/1721.1/103801/12248_2016_9892_ReferencePDF.pdf?sequence=1&isAllowed=y))

### Khera et al.: a bystander payload has to travel before it can be helpful

**Citation:** Khera E, Cilliers C, Bhatnagar S, Thurber GM. Computational transport analysis of antibody-drug conjugate bystander effects and payload tumoral distribution: implications for therapy. Molecular Systems Design & Engineering. 2018;3:73–88; first published online 2017. DOI: 10.1039/C7ME00093F. [Full text](https://pubs.rsc.org/en/content/articlehtml/2018/me/c7me00093f).

This is the most directly useful paper for refusing to treat “bystander effect” as a binary checkbox: its Krogh-cylinder model couples vascular delivery, interstitial ADC diffusion, receptor binding and processing to payload release, target binding, membrane exchange, diffusion and washout. A payload can be retained too locally to cover distant cells or enter cells too slowly to avoid being lost from the tumor, making its predicted benefit dependent on competing transport timescales. ([Khera et al.](https://pubs.rsc.org/en/content/articlehtml/2018/me/c7me00093f))

I would use it to motivate a separate “transfer versus loss” module. Same-cell X/Y data would remain an input description, not a substitute for distances, vascular access or neighboring-cell composition.

**Evidence strength and caveat:** Parameters were literature-derived or independently estimated rather than fitted to new cellular-resolution bystander concentration data, which were unavailable; the work compares predictions with retrospective studies and builds on previously evaluated transport models. Its intracellular threshold is a pharmacological proxy, not a universal death threshold, and its predicted transport optimum is conditional on the modeled geometry and payload assumptions. ([Khera et al.](https://pubs.rsc.org/en/content/articlehtml/2018/me/c7me00093f))

### Singh et al.: the target-negative population deserves its own equations

**Citation:** Singh AP, Seigel GM, Guo L, Verma A, Wong GG-L, Cheng H-P, Shah DK. Evolution of the Systems Pharmacokinetics-Pharmacodynamics Model for Antibody-Drug Conjugates to Characterize Tumor Heterogeneity and In Vivo Bystander Effect. Journal of Pharmacology and Experimental Therapeutics. 2020;374:184–199. DOI: 10.1124/jpet.119.262287. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC7318793/).

This model links systemic ADC and payload pharmacokinetics to heterogeneous tumors, cell-specific uptake and processing, MMAE–tubulin occupancy, delayed cell killing and release of material from dying cells. Its high- and low-HER2 populations are represented separately, so bystander killing emerges from exposure and pharmacology rather than from a fixed added efficacy fraction. ([Singh et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7318793/))

For a future bispecific extension, I would replace a single “tumor cell” with explicitly defined X-high/Y-low, X-low/Y-high, double-high and double-low populations, while allowing their trafficking and payload sensitivities to differ. Quadrants would then define bookkeeping categories, not four preordained response classes.

**Evidence strength and caveat:** The heterogeneous-tumor PK component made an a priori prediction compared with measured coculture-tumor exposures, whereas the tumor-growth inhibition component was fitted to the reported treatment datasets. Fractionated-dose advantages and certain nonlinear bystander relationships remained predictions needing experimental corroboration; fitting common killing parameters also limits what can be concluded about intrinsically different cellular sensitivities. ([Singh et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7318793/))

### Scheuher et al.: useful integration without pretending every missing quantity was measured

**Citation:** Scheuher B, Ghusinga KR, McGirr K, Nowak M, Panday S, Apgar J, Subramanian K, Betts A. Towards a platform quantitative systems pharmacology (QSP) model for preclinical to clinical translation of antibody drug conjugates (ADCs). Journal of Pharmacokinetics and Pharmacodynamics. 2024;51:429–447; published online October 3, 2023. DOI: 10.1007/s10928-023-09884-6. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC11576657/).

This is the strongest integration reference in the set: a modular framework connects intracellular ADC processing and payload release to tumor and systemic disposition, off-tumor target binding, xenograft responses and virtual clinical trial simulations. Using T-DM1 and T-DXd allows the authors to distinguish antibody-associated properties from linker–payload-dependent processing rather than equating a shared antigen with a shared drug. ([Scheuher et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11576657/))

I would use its modular structure as an architectural reference, not a mandate to build a comprehensive QSP platform into a small audit. The immediate lesson is to keep parameter provenance visible at every interface between modules.

**Evidence strength and caveat:** The framework uses published data for staged calibration and comparison, but evidence density differs between components: the authors lacked corresponding in vitro disposition data for T-DXd and used literature-derived payload properties without that cellular calibration. It also does not explicitly resolve intratumoral spatial distributions or separate direct from bystander killing, so integration across scales should not be confused with complete representation of every mechanism. ([Scheuher et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11576657/)) Virtual clinical trial agreement is not proof that each latent intracellular state was independently identified, nor a validation for an arbitrary new bispecific format.

### Ray et al.: coexpression is not a ternary complex

**Citation:** Ray CMP, Yang H, Spangler JB, Mac Gabhann F. Mechanistic computational modeling of monospecific and bispecific antibodies targeting interleukin-6/8 receptors. PLOS Computational Biology. 2024;20:e1012157. DOI: 10.1371/journal.pcbi.1012157. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC11189202/).

Although this is not an ADC model, it is particularly relevant to the proposed bispecific extension because it distinguishes binary from ternary complexes, first-arm from second-arm binding, receptor ratios, dose and washout. Detailed balance constrains its reaction cycle; a cell bearing both receptors does not automatically place every bound antibody in the dual-engaged state. ([Ray et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11189202/))

I would treat this as a reference for which generic binding states must be distinguished before attaching an ADC trafficking model. I would not import its named constructs, sequences, fitted parameter sets or associated technology into this project.

**Evidence strength and caveat:** The model was calibrated to the same flow-cytometry binding dataset it reproduces, with experiments at 4°C and negligible receptor synthesis, internalization and degradation assumed under those conditions. It does not establish trafficking at 37°C, productive payload delivery or killing; the article also discloses Johns Hopkins intellectual property covering technologies described in the manuscript, so open publication must not be mistaken for unrestricted implementation permission. ([Ray et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC11189202/))

### Wood et al.: cell identity changes what “targeting the tumor” means

**Citation:** Wood et al. Mechanistic modeling suggests stroma-targeting antibody-drug conjugates as an alternative to cancer-targeting in cases of heterogeneous target expression. PLOS Computational Biology. 2025;21:e1012839. DOI: 10.1371/journal.pcbi.1012839. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/).

This study develops progressively richer ODE models for ADC binding, processing and bystander transfer, including settings in which cancer cells and stromal cells have different target expression and the tumor recruits stroma. It is useful for asking whether the cell that captures the ADC must be the cell whose elimination is desired. ([Wood et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/))

For Antigen-tail Check, the implication is a metadata requirement: an X/Y distribution must have a declared cell population, and coexpression within tumor cells must not be conflated with expression distributed across tumor and stromal compartments. A future population model should keep those identities explicit.

**Evidence strength and caveat:** This is a conditional modeling argument, not experimental proof that stroma targeting is generally superior. Its well-mixed treatment does not resolve spatial neighborhoods, and omissions including evolving resistance and immune effects constrain translation to particular tumors and formats. ([Wood et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/))

## Useful supporting papers

- **Vasalou C, Helmlinger G, Gomes B (2015):** A Mechanistic Tumor Penetration Model to Guide Antibody Drug Conjugate Design. PLOS ONE 10:e0118977. DOI: 10.1371/journal.pone.0118977. Useful for explicit coupling of receptor kinetics, tumor penetration and ADC design in a radial transport framework; conclusions inherit its idealized tissue geometry and model assumptions. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC4364906/).
- **Weddell J et al. (2021, online 2020):** Mechanistic Modeling of Intra-Tumor Spatial Distribution of Antibody-Drug Conjugates: Insights into Dosing Strategies in Oncology. Clinical and Translational Science 14:395–404. DOI: 10.1111/cts.12892. Useful for connecting systemic PK, spatial distribution and dosing, but it does not explicitly model free-payload disposition and its dose-fractionation findings should remain labeled predictions. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC7877868/).
- **Lam I et al. (2022):** Development of and insights from systems pharmacology models of antibody-drug conjugates. CPT: Pharmacometrics & Systems Pharmacology 11:967–990. DOI: 10.1002/psp4.12833. This is the orientation review for navigating cellular, tissue and translational models, not independent experimental validation of those models. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC9381915/).

## A striking experimental challenge case

In a trastuzumab-insensitive xenograft setting, Cilliers and colleagues found that adding unconjugated antibody to a fixed T-DM1 dose could improve tumor penetration and efficacy while reducing ADC uptake per cell; the in vitro combination could look antagonistic even when the in vivo outcome improved. The result makes a useful antidote to the assumption that maximizing uptake in the easiest-to-reach cells necessarily maximizes therapeutic benefit. ([Cilliers et al., Cancer Research, 2018;78:758–768, DOI: 10.1158/0008-5472.CAN-17-1638](https://pmc.ncbi.nlm.nih.gov/articles/PMC5903206/))

I would use this as a challenge dataset for a later transport model, not as a numerical validation of the current coexpression audit. A model that cannot represent the difference between “more drug per reached cell” and “more cells reached” cannot even ask the question this experiment answers.

## What these papers imply for the next small model

My recommendation is **Productive-delivery Check: “Does more binding actually deliver more active payload?”** It should remain smaller than a whole-body QSP platform: explicitly separate surface engagement, endosomal routing, lysosomal processing, active intracellular payload and loss, then connect those states to measured time courses.

The following equations are an original schematic mass-balance proposal, not a reproduction of a published model or a fit to a therapeutic construct. This full proposal, including surface engagement and payload–target binding, is not implemented. A restricted version with prescribed entry and no target binding is now executable in the separate [synthetic worked example](productive-delivery.html); its complete closed balances, assumptions and solver checks are in [the companion mathematics](delivery-model.md). The broader proposal shows the bookkeeping I would require before making the additional mechanistic claims:

\[
\frac{dE}{dt}=k_{\mathrm{int}}C-(k_{\mathrm{lys}}+k_{\mathrm{rec}})E
\]

\[
\frac{dL}{dt}=k_{\mathrm{lys}}E-k_{\mathrm{proc}}L
\]

\[
\frac{dP_{\mathrm{lys}}}{dt}
=\nu k_{\mathrm{proc}}L
-(k_{\mathrm{esc}}+k_{\mathrm{loss,lys}})P_{\mathrm{lys}}
\]

\[
\frac{dP_{\mathrm{cyt}}}{dt}
=k_{\mathrm{esc}}P_{\mathrm{lys}}
-k_{\mathrm{loss,cyt}}P_{\mathrm{cyt}}
-k_{\mathrm{on,T}}P_{\mathrm{cyt}}T_{\mathrm{free}}
+k_{\mathrm{off,T}}PT
\]

Here C is surface-bound ADC supplied by a separate binding module; E and L are internalized intact ADC in endosomal and lysosomal states; ν is the effective released-payload yield; Plys and Pcyt are free active payload in their respective compartments; PT is payload–target complex. Amounts must be expressed in a consistent per-cell amount unit, with volume factors in second-order rate constants; rates are inverse time except the association coefficient, which also carries inverse-amount units.

This sketch is deliberately incomplete: a closed implementation also needs equations for surface binding and recycled material, PT and target turnover, extracellular exchange, any cell-growth dilution, and explicit accounting of irreversible loss. It must not count degradation as cytosolic delivery, silently merge recycling with destruction, or infer killing directly from a payload compartment.

### The insight a small kinetic model should earn

Under a further simplifying scenario, hold the internalization input Jin = kint C constant, omit payload–target binding and growth dilution, assume positive finite first-order rates, and allow no intact-ADC loss from L except productive processing. At steady state, the above balances give:

\[
P_{\mathrm{cyt,ss}}
=\frac{\nu J_{\mathrm{in}}}{k_{\mathrm{loss,cyt}}}
\frac{k_{\mathrm{lys}}}{k_{\mathrm{lys}}+k_{\mathrm{rec}}}
\frac{k_{\mathrm{esc}}}{k_{\mathrm{esc}}+k_{\mathrm{loss,lys}}}.
\]

This is a derived toy-model result, not a published therapeutic parameterization. It separates input flux, productive routing, escape versus loss and cytosolic retention. The routing fraction is a probability for one internalization episode; if recycled material rebinds and enters again, its eventual fate requires that return process to be modeled explicitly.

The browser companion implements precisely this restricted topology, with continuous or pulse entry and explicit accounting of returned ADC and removed payload. It keeps arrival flux, retained intact conjugate, active cytosolic stock and time-integrated exposure separate; none is converted into a killing prediction.

An invented example makes the consequence concrete. An input of 100 ADC molecules per cell per hour with a productive-routing fraction of 0.1 supplies 10 molecules per hour to processing; an input of 50 with a fraction of 0.5 supplies 25. With all subsequent factors equal, the lower-uptake case delivers 2.5 times the steady productive flux. The numbers are illustrative, and transient accumulation is not this steady-state flux.

There is a subtler result: kproc disappears from the steady-state expression because, in this deliberately restricted model, processing is the sole exit from L. It still controls lysosomal inventory and the approach to steady state. A slower processing rate can therefore alter a finite-time endpoint without altering the eventual flux; adding competing loss, finite capacity, pulse exposure or cell division changes that conclusion.

This is the kind of insight that would justify the next model. It changes the experiment from “which construct has the higher uptake signal?” to “which observable distinguishes input, routing, processing delay and retention?” One payload plateau identifies only a combination of parameters in this expression, not each mechanism independently.

For a bispecific, the surface input C should be partitioned into singly engaged X, singly engaged Y and dual-engaged states with potentially different routing rates. This is a proposed design choice to test, not a claim that every format has different rates; initial expression pairs alone cannot identify them.

I would require five challenge cases before calling that next module useful:

- **Matched binding, divergent processing:** keep the surface-bound input fixed while changing trafficking or payload-release rates.
- **Fast uptake, high recycling:** test whether a high internalization signal can coexist with low productive lysosomal flux.
- **Matched total payload, divergent active payload:** separate intact conjugate and sequestered products from cytosolic active species.
- **Transfer versus loss:** add extracellular payload explicitly before describing any neighboring-cell benefit.
- **Parameter ambiguity:** show alternative parameter combinations that fit one endpoint but diverge in a second time course; refuse unique mechanism claims without discriminating data.

The present release stops before these dynamic claims. It audits expression pairing, supplies sharp bounds when pairing is missing, and records mechanism evidence without converting evidence checkboxes into a probability of therapeutic success.

## Scope and reuse

The available texts of selected papers were reviewed for author affiliations, funding, disclosures and explicit source connections under the project's exclusion criteria. This is a bounded literature screen, not proof that no indirect relationship exists and not a patent freedom-to-operate opinion.

No published construct sequence, figure, fitted therapeutic parameter set or third-party code is incorporated into the calculation engine. The schematics are original qualitative drawings; the default data are invented mathematical examples. Citations support scientific context, not a claim that the software implements or has been validated by the cited papers.
