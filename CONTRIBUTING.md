# Contributing

## Current workflow

Canonical code is in `src/`. The root standalone HTML and ZIP files are legacy artifacts; do not edit them.

For any gameplay change:

1. describe the rule and edge cases;
2. add a minimal reproducible plan/state example;
3. verify both fighter perspectives, the public log, final state, and replay;
4. update the visible rules and generated model prompt together;
5. document any compatibility change.

Every change should pass formatting, type checking, tests, and a production build. Gameplay changes need a scenario-level regression test. Contract changes need schema migration and fixture updates. Generated standalone HTML and ZIP artifacts should be produced by the release command, never edited manually.

Keep commits narrow: structural extraction, behaviour fixes, balance changes, and visual redesigns should normally be separate so reviewers—and coding agents—can tell exactly why outputs changed.
