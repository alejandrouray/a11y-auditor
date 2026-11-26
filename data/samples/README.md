# Accessibility samples

20 small HTML snippets, each with accessibility failures we know about in advance. They are the test set for the auditor: the structured output (task 1.5), the axe-core tool (task 1.6), and later the evals and RAG.

## Files

- `NN-slug.html`: one snippet. Most are fragments; `20-missing-page-lang.html` is a full page because its failure lives on `<html>`.
- `manifest.json`: the expected issues for every snippet. `src/lib/samples.ts` validates it with zod and `loadSamples()` returns each sample with its HTML.

Each expected issue has:

| Field | Meaning |
| --- | --- |
| `wcag` | WCAG 2.2 success criterion, e.g. `1.4.3` |
| `axeRule` | axe-core rule id, or `null` when axe has no rule for it |
| `impact` | `minor`, `moderate`, `serious` or `critical` (axe's scale) |
| `selector` | CSS selector of the failing element |
| `detectableByAxe` | `true` when `axeRule` is set; these are the issues axe should catch |
| `description` | why it fails, in plain words |

## What the split means

13 of the 24 issues have an axe rule. The other 11 (a useless `alt`, a placeholder used as label, focus that is not managed, link text like "Click here"...) need judgment, so they are what the model has to add on top of axe.

## Known caveats (to check in task 1.6)

- **Contrast in jsdom.** jsdom does not render, so axe often reports `color-contrast` as *incomplete* instead of a violation. Samples 07 and 08 are marked detectable because axe catches them in a real browser.
- **Page-level rules.** On fragments, axe also reports page rules such as `region`, `landmark-one-main` or `page-has-heading-one`. They are not part of these samples and should be ignored.
- **Predictions, not measurements.** The `axeRule` values are what axe should report; task 1.6 runs axe on every sample and confirms them.

## Adding a sample

1. Add `NN-slug.html` with a small snippet. Keep everything else in it accessible, so the only failures are the ones you list.
2. Add its entry to `manifest.json`.
3. Run `npm test`: the tests check that every HTML file is in the manifest, that ids are unique and that selectors match the snippet.
