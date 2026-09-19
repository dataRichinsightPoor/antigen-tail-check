# Antigen-tail Check
## Scientific model and first-release specification

Data-Rich, Insight-Poor · 99 Small Problems · No. 02  
Useful models for assumptions with expensive ambitions.  
Version: 0.1.0-alpha · Research-use preview

## The question

Are two expression-matched populations actually comparable? Antigen-tail Check tests the narrower proposition that matching an expression summary is sufficient to match an expression distribution, then shows how a specified response mapping changes the functional interpretation.

The tool has two layers that must not be confused. The first is descriptive: compare the observed or deliberately constructed distributions, their quantiles, their low-expression fractions and their cumulative-distribution separation. The second is conditional: apply a shared, explicitly hypothetical response function to each distribution. The second layer cannot discover a biological response law from expression alone.

Use it when selecting or comparing assay-cell populations, investigating a clone or lot change, or deciding whether a population average has concealed a consequential subpopulation. The intended decision is whether the distribution deserves a functional comparison or a better measurement, not whether a therapeutic will succeed.

## The scientific basis

### Antigen recognition is not one endpoint

Watanabe and colleagues studied antigen-density dependence in a CD20 CAR-T system and found different expression requirements for lysis versus activation, cytokine production and proliferation; their lowest tested CD20 expression group, approximately 240 specific antibody-binding sites per cell, underwent partial lysis but did not behave like the higher-expression groups across activation endpoints ([Watanabe et al., 2015](https://academic.oup.com/jimmunol/article/194/3/911/7972840?guestAccessKey=)). The paper also reports an approximately 1,000-site half-maximal cytotoxicity region, illustrating why the lowest detectable response, a response midpoint and complete eradication are not interchangeable thresholds ([Watanabe et al., 2015](https://academic.oup.com/jimmunol/article/194/3/911/7972840?guestAccessKey=)).

Those findings motivate endpoint-specific comparison, not a universal numerical cutoff. No threshold, construct, sequence or fitted parameter from that study is implemented here.

### Cell-autonomous expression is not all of ADC pharmacology

Wood and colleagues model antigen-positive and antigen-negative populations, payload transport and bystander effects, showing that the consequences of heterogeneous target expression depend on interactions among target-positive cells, target-negative cells and payload disposition ([Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)). Antigen-tail Check does not reproduce those ODEs or borrow their therapeutic parameters; the study explains why a marginal expression distribution is an informative starting point but an incomplete ADC-response model.

For an ADC, interpreting the Hill scenario as cell killing would require evidence that a shared, cell-autonomous expression-to-killing relationship is adequate under the chosen dose, exposure time, growth conditions and payload context. Bystander transfer, unequal payload sensitivity or spatial organization can invalidate that interpretation; payload-transfer and growth dependencies are explicit in the published ADC model ([Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)).

### Fc-dependent binding does not establish functional susceptibility

Tan and colleagues show how immune-complex valency and Fc composition affect receptor binding, and distinguish binding from effector response in their experimental and modeling systems ([Tan et al., 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10404157/)). That paper is used as a boundary on interpretation, not as direct evidence for an antigen-tail threshold or a population-heterogeneity result.

The tool therefore does not advertise an “ADCC threshold,” an “ADC threshold,” or a “CAR threshold.” It asks how two distributions differ under a user-specified cutoff or common response mapping. A therapeutic mechanism supplies the experimental question; it does not license the same response law across modalities.

### The measurement scale is part of the model

ABC measures antibodies bound per cell under a specified staining definition, while MESF and ERF are fluorescence-equivalence measures; calibration, standardization and low-signal resolution are distinct concerns ([Wang and Hoffman, 2017](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=921423)). None of those labels, by itself, establishes the number of therapeutically accessible receptors per cell.

Both populations need a compatible mapping from the biological quantity of interest to the reported signal. A common unit label does not resolve different staining reagents, binding stoichiometry, epitope accessibility, gating, background distributions or instrument behavior; the calibration reference discusses these distinctions and the special difficulty of resolving dim populations ([Wang and Hoffman, 2017](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=921423)).

In particular, the app is an audit of per-cell abundance proxies, not a measurement of molecules per square micrometer. Equal abundance does not mathematically imply equal surface density when cell surface areas differ. That distinction must be settled experimentally when the proposed mechanism depends on local surface organization.

## Mathematical definition

The following derivations define this implementation. They are general probability calculations, not a claim of a new biological law.

### Distribution, weights and arithmetic mean

For population \(j \in \{A,B\}\), let \(a_{ji}\geq0\) be an expression value and \(c_{ji}\) its positive integer multiplicity. An event-level file has \(c_{ji}=1\).

\[
n_j=\sum_i c_{ji},\qquad w_{ji}=\frac{c_{ji}}{n_j},\qquad \mu_j=\sum_iw_{ji}a_{ji}.
\]

Repeated identical values are merged exactly. Counts represent observed events or synthetic multiplicities, never biological replicate numbers. Histogram-bin centers with bin counts are not exact observations and are outside this release's input contract.

The descriptive standard deviation is

\[
s_j=\sqrt{\sum_iw_{ji}(a_{ji}-\mu_j)^2},\qquad CV_j=s_j/\mu_j.
\]

This is the weighted population standard deviation of the supplied distribution, not an unbiased estimator of a biological population parameter. CV is undefined at zero mean. The quantile \(Q_j(p)=\inf\{t:F_j(t)\geq p\}\) is reported at 5%, 50% and 95%.

The symmetric mean mismatch is

\[
\delta_\mu=100\frac{|\mu_A-\mu_B|}{(\mu_A+\mu_B)/2}.
\]

When both means are zero, the mismatch is defined as zero. “Mean matched” means only that this descriptive mismatch is within the user-selected tolerance. It is not a statistical equivalence test.

### The low-expression tail

\[
F_j(t)=\sum_iw_{ji}\mathbf1(a_{ji}\leq t),\qquad
\Delta_F(t)=F_B(t)-F_A(t).
\]

The cutoff is inclusive: a cell exactly at \(T\) belongs to the at-or-below-\(T\) fraction. A hard response interpretation would therefore use \(g_T(a)=\mathbf1(a>T)\), whose unresponsive fraction is exactly \(F_j(T)\). This convention is explicit because ties can be material in coarse or synthetic data.

For a prespecified interval \([L,U]\), the largest descriptive tail difference is

\[
D_{[L,U]}=\sup_{L\leq t\leq U}|F_A(t)-F_B(t)|.
\]

The software evaluates both interval endpoints and every empirical jump within the interval. It does not approximate this statistic from the 101 plotted sweep points. If \(D_{[L,U]}\) exceeds the user's tail-gap margin, that margin fails for the supplied distributions. Passing it establishes neither biological equivalence nor a population-level confidence statement.

The global maximum

\[
D=\sup_{t\geq0}|F_A(t)-F_B(t)|
\]

is the two-sample Kolmogorov–Smirnov distance used descriptively. No KS hypothesis test or p-value is performed.

### A response bound that does not require fitting a Hill curve

Suppose \(g\) is the same nondecreasing function for both populations and its values lie in \([0,1]\). Then

\[
|\mathbb E_A[g(a)]-\mathbb E_B[g(a)]|\leq D.
\]

For a differentiable \(g\), the result follows from

\[
\mathbb E_j[g(a)]
=g(0)+\int_0^\infty g'(t)\,[1-F_j(t)]\,dt,
\]

so that

\[
|\mathbb E_A[g]-\mathbb E_B[g]|
\leq D\int_0^\infty g'(t)\,dt
\leq D.
\]

Monotone step functions give the corresponding general result; for a finite empirical distribution a step at a maximally separated cutoff attains the bound. Thus the global CDF distance is a worst-case response-gap bound over this function class.

The qualifications are essential. A small global D limits response differences only under a shared, bounded, monotone mapping. It does not constrain differences caused by different biology, nonmonotone responses, different drug exposures or population interactions. A small interval-specific D does not constrain unexamined thresholds; the global bound cannot be replaced by the interval-specific value without additional restrictions on where g changes.

### Order, crossing and why “more heterogeneous” is not a mechanism

If \(F_A(t)\leq F_B(t)\) for all t, then A is first-order stochastically higher in expression than B, and every shared nondecreasing response has an average at least as high in A. If the CDFs cross, no universal ranking exists over that entire class of response mappings.

Two distinct nonnegative distributions with exactly the same finite mean cannot have strict first-order stochastic dominance. Their equal integrated survival functions force any nontrivial CDF difference to change sign. The equal-mean case therefore makes threshold sensitivity a mathematical consequence, not a display artifact.

This does not imply that every Hill family or every experimentally plausible parameter range exhibits a reversal. It means that a ranking based on the mean alone has not resolved the question.

### The optional Hill scenario

\[
g(a;T,h)=\frac{a^h}{a^h+T^h},\qquad T>0,\ h>0,
\]

\[
R_j(T,h)=1-\sum_iw_{ji}g(a_{ji};T,h).
\]

R is labeled the “unresponsive share under a hypothetical mapping.” It is not automatically the fraction of live cells after treatment. T is the half-response expression level because \(g(T)=1/2\), not the lowest expression that can produce a detectable response. The slope h is a phenomenological shape parameter, not an estimate of receptor number, molecular stoichiometry or cooperativity.

The mean-only comparator is

\[
R^{\mathrm{mean}}_j=1-g(\mu_j;T,h).
\]

The difference between \(R_j\) and \(R^{\mathrm{mean}}_j\) is the aggregation error under this assumed function. No response parameters are fitted and the defaults are invented.

At h = 1, g is concave and averaging expression first overestimates average response by Jensen's inequality. For h > 1, curvature changes sign:

\[
g''(a)=
\frac{hT^h a^{h-2}\left[(h-1)T^h-(h+1)a^h\right]}
{(a^h+T^h)^3},\qquad a>0.
\]

The inflection is at \(a=T[(h-1)/(h+1)]^{1/h}\). Heterogeneity therefore does not always reduce response; its effect depends on where expression lies relative to the response curve. A slogan about variance cannot substitute for integrating the actual distribution.

As h grows without bound, g approaches a hard step away from a = T, but g(T) remains 1/2. If there is an atom at T, the limiting unresponsive share is \(\Pr(a<T)+\tfrac12\Pr(a=T)\), not the inclusive \(F(T)\). The app never silently equates those two quantities.

When the sensitivity sweep begins at T = 0, the first plotted value is the exact \(T\to0^+\) limit for fixed positive h:

\[
R_j(0^+,h)=\Pr_j(a=0).
\]

No pseudocount is added. All other calculations use the linear input values; the display-only log₁₀(value + 1) axis exists to show genuine zeros.

## A striking synthetic case

Population A places all its mass at 50,000. Population B places 20% at 1,000 and 80% at 62,250. These are deliberately discrete mathematical distributions, not measurements of a biological cell line.

\[
\mu_A=50{,}000,\qquad
\mu_B=0.2(1{,}000)+0.8(62{,}250)=50{,}000.
\]

At an expression cutoff of 10,000, A has 0% at or below the cutoff and B has 20%. With the invented Hill scenario T = 10,000 and h = 4, the unresponsive shares are 0.159744% for A and 20.051241% for B. A mean-only calculation returns 0.159744% for both.

The striking result is not a claim that one cell line leaves 126 times more surviving tumor cells. It is that the identical mean erases a roughly 126-fold difference in this specific hypothetical unresponsive share. The biological claim would require independent functional evidence.

Move the hard cutoff to 60,000 and the descriptive ranking reverses: A is now 100% at or below the cutoff while B is 20%. The global distance is 80 percentage points, reached between 50,000 inclusive and 62,250 exclusive. It is intentionally different from the 20-point gap at the original 10,000 cutoff.

The demo also includes identical-distribution and genuine-zero-compartment controls. A zero in the synthetic model is exact; a low or background-level fluorescence measurement is not evidence of exactly zero antigen.

## The blind spots it makes visible

### A summary statistic is not an identity

Matching arithmetic means does not match quantiles, zero mass or functional expectations. Matching geometric means is a different operation again: for a mathematically lognormal variable with log-scale parameters m and s, the geometric mean is exp(m), while the arithmetic mean is exp(m + s²/2). Reports should specify whether “MFI” means arithmetic mean, geometric mean or median rather than allowing the acronym to stand in for a definition.

### The marginal distribution is not the joint biology

Let z represent another response-relevant cell property. Even identical marginal antigen distributions permit

\[
\mathbb E_j[\mathrm{response}]
=\int\int g(a,z)\,p_j(z\mid a)\,p_j(a)\,dz\,da
\]

to differ when \(p_A(z\mid a)\neq p_B(z\mid a)\). Antigen matching alone does not identify those conditional distributions. Integration is the scientific point: expression is not separable from the rest of the system merely because it fits in one spreadsheet column.

### A measured tail can be an instrument boundary

The release does not reconstruct censored observations, undo compensation, estimate autofluorescence or decide that a clipped value is a true zero. Differences in detection threshold and the ability to resolve dim populations are not the same measurement property ([Wang and Hoffman, 2017](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=921423)). If the tail is unresolved, improving the measurement is the next experiment; fitting a steeper Hill curve is not.

### Expression is a snapshot, not a trajectory

The implemented distributions are static. There is no antigen turnover, target modulation, internalization, growth, selection, effector depletion or time coordinate. The need for growth and transport states in published ADC modeling illustrates what is omitted by a static distribution audit ([Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)).

## Input and output contract

The browser accepts one nonnegative linear value per row, or exact value,count rows with positive integer counts. Optional headers are value, antigen, value,count or antigen,count. Commas and tabs separate fields; commas are not thousands separators. Blank lines are ignored. Scientific notation is accepted.

Expression values must lie between 0 and 10¹²; a row count cannot exceed 10⁹ and total represented counts cannot exceed 10¹². Each population is limited to 100,000 rows and 5 million text characters, with a 5 MB file-size limit for local import. Text editors are restricted to 20,000 characters; pastes over 2,000 lines are redirected to local CSV/TXT import. Large files remain outside the text editor and calculation runs in a background browser worker. These are numerical/interface bounds, not claims about biologically plausible ranges. Raw FCS input, histogram reconstruction and negative compensated signals are unsupported.

Both populations must use the same declared scale: ABC, MESF or linear relative fluorescence. The user must also attest a shared measurement mapping or validated harmonization, compatible population gates, and a quantitatively resolved comparison range. Empirical mode clears the synthetic confirmations and requires provenance/calibration/replicate notes. Local file import also clears these assertions and selects empirical mode as a conservative default; a deliberately synthetic file can be relabeled by the user. Attestation is not independent validation.

Outputs include means, descriptive CVs, quantiles, inclusive tail fractions, exact global and interval-specific CDF distances, empirical stochastic-order status, Hill-scenario averages, mean-only comparators and a 101-point sensitivity sweep. JSON includes normalized distributions, original multiplicities, user assertions, parameters, provenance, version, timestamp, exact CDF steps and limitations. CSV includes the sampled sweep, units, provenance category, slope and tool version; it is not an exhaustive list of CDF breakpoints.

Changing any analytical input immediately hides old results and removes access to stale exports until rerun. Unit mismatch, unresolved-tail attestations, missing empirical notes, blank numeric fields and invalid values block analysis with a specific explanation. No calibration conversion is performed.

## Experimental validation plan

Numerical correctness and empirical predictive validity are separate workstreams. This preview has synthetic and computational tests; it has no wet-lab validation or demonstrated prediction accuracy.

For distribution validation, prepare independently characterized low- and high-expression populations and defined mixtures. Acquire the complete intended viable single-cell population using a prespecified gating and calibration procedure. Check whether measured mixture means and cumulative distributions agree with their independently measured components and known mixture proportions. Vary acquisition day, staining conditions and biological preparation to identify measurement drift rather than treating more events as more independent experiments.

For a functional test, specify one endpoint, exposure, observation time and effector context. Estimate or choose a response mapping from separate training conditions, freeze it and predict held-out mixtures. Compare the integrated-distribution model against the mean-only baseline using absolute response error across independent biological replicates. Do not refit the Hill midpoint to each held-out mixture and call the resulting agreement a prediction.

A particularly informative test holds the arithmetic mean approximately constant while changing the low-expression fraction. Independently characterize mixture members for other susceptibility variables; otherwise a difference can be attributed neither uniquely to antigen nor to the tail. For ADCs, comparing mixtures versus separated populations can test whether a cell-autonomous approximation fails in the presence of payload transfer, consistent with mechanisms modeled by Wood and colleagues ([Wood et al., 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/)).

Prespecify the mean and tail margins before the confirmatory comparison. Analyze independent biological replicates separately or with an appropriate hierarchical design. Event-level bootstrapping alone does not include preparation-to-preparation uncertainty; this first release deliberately provides no inferential equivalence claim.

## First-release scope and acceptance criteria

The release is a local-in-browser distribution calculator, not a calibration service or therapeutic-response engine. It uses no backend, uploads no entered data, stores no values persistently and requires no account. The only third-party page resource is a font stylesheet/font delivery service.

Acceptance requires exact agreement with the analytic discrete-mixture example; identity and reversal controls; stable zero and extreme-value handling; inclusive tie behavior; scale invariance when expression and thresholds scale together; symmetry of the global distance; and the common-monotone-response bound across generated tests. It also requires invalid-input rejection, blocked incompatible scales, cleared empirical attestations, stale-result suppression and correct report downloads.

The planned next scientific extensions are interval-valued/censored measurements, externally estimated calibration uncertainty and biological-replicate-aware equivalence intervals. None is implemented or implied by the current preview. An advanced mechanistic model would be a separate model with explicit kinetics and validation, not a relabeling of the Hill scenario.

## References

1. Watanabe K, Terakura S, Martens AC, et al. Target antigen density governs the efficacy of anti–CD20-CD28-CD3 ζ chimeric antigen receptor–modified effector CD8+ T cells. Journal of Immunology. 2015;194(3):911–920. DOI: 10.4049/jimmunol.1402346. Full text: https://academic.oup.com/jimmunol/article/194/3/911/7972840?guestAccessKey=

2. Wang L, Hoffman RA. Standardization, calibration, and control in flow cytometry. Current Protocols in Cytometry. 2017;79:1.3.1–1.3.27. DOI: 10.1002/cpcy.14. Full text: https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=921423

3. Wood NE, Cengiz A, Gao M, Ratushny AV, Straube R. Mechanistic modeling suggests stroma-targeting antibody-drug conjugates as an alternative to cancer-targeting in cases of heterogeneous target expression. PLOS Computational Biology. 2025;21(8):e1012839. DOI: 10.1371/journal.pcbi.1012839. Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC12370192/

4. Tan ZC, Lux A, Biburger M, et al. Mixed IgG Fc immune complexes exhibit blended binding profiles and refine FcR affinity estimates. Cell Reports. 2023;42(7):112734. DOI: 10.1016/j.celrep.2023.112734. Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC10404157/

## Provenance and use boundaries

The implementation consists of independently written, general empirical-distribution and response-integration calculations. Demonstration values are synthetic. No company-specific construct, sequence, product-design recipe, unpublished observation, proprietary assay procedure or fitted therapeutic parameter set is provided. The cited papers establish scientific motivation and limits, not endorsement or regulatory qualification.

Public literature is not a blanket license to practice every method it describes. Source screening cannot establish the absence of all indirect relationships or substitute for a claim-specific intellectual-property review. This research-use preview is not a legal clearance, a validated bioassay or a clinical decision tool.
