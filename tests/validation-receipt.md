# Computational validation receipt

Version: 0.1.0-alpha. These checks establish implementation behavior, not biological predictive validity.

## Automated mathematical checks

Eleven Node test groups pass. They cover the analytic equal-mean mixture, reversal, ties, quantiles, true zeros, identity, scale invariance, stochastic dominance, interval boundaries, invalid input, stable extreme arguments, generated common-monotone-response inequalities, a 100,000-row input and agreement of the generated preview worker with the tested numerical core.

The reference example has equal means of 50,000, at-or-below-10,000 fractions of 0% and 20%, a global CDF distance of 80 percentage points, and hypothetical Hill unresponsive shares of 0.159744% and 20.051241% at T = 10,000 and h = 4.

## Browser checks

Thirty-six named functional checks passed in Chromium. They include all four examples, input edits, stale-result suppression, comparability and resolution blocks, incompatible units, censored/negative input rejection, empirical-mode assertion resets, required provenance, margins, interval distances, JSON and CSV downloads, local source links, theme changes, file imports, file clearing, oversize-file rejection and cancellation.

A 100,000-event synthetic CSV was imported locally without placing its contents into the text editor. The mean of the sequence 0…99,999 was 49,999.5, as expected. The theme control remained responsive during calculation; resetting cancelled the active computation and restored the original example.

Exploratory checks included two all-zero populations, out-of-sweep point evaluation and a changed cutoff on mobile. Desktop, mobile and narrow-view reflow were inspected; no horizontal page overflow or browser script errors remained. Charts use solid/dashed styles plus labels as well as color.

## Stress-test finding and mitigation

Attempting to insert 50,000 lines directly into a Chromium text editor caused the test renderer to become unresponsive. This was not a failure of the numerical model. The editor is now bounded to 20,000 characters, large pastes are intercepted, and larger datasets use local CSV/TXT import plus background computation. The successful 100,000-event file test exercises that replacement path.

## Scientific exclusions

There has been no wet-lab validation, independent biological replication, therapeutic-response fit, clinical evaluation, calibration verification, uncertainty-coverage study or inferential equivalence analysis. User attestations are not a substitute for those studies. Refer to `web/model.md` for the prospective experimental-validation design and complete boundaries.
