# Medeo front-end baseline

Captured on 2026-08-24 from:

`https://medeo.app/c/proj_01M0T4NXBS6AZ1ANB1P6A8CDVK`

Viewport: `1728 × 817`, DPR `2`.

This directory is a read-only implementation reference for an interview prototype. The files reflect one authenticated, live project state and should not be treated as a stable public API. Review Medeo's asset and font licenses before shipping or redistributing any copied production asset.

## Captured files

- `editor-agent-skeleton.html`: focused, geometry-annotated DOM outline for the asset browser, player, timeline, and Agent panel.
- `dom-skeleton.html`: shallow whole-page DOM outline.
- `design-tokens.json`: root CSS variables, observed color/type/radius/spacing frequencies, and panel dimensions.
- `css/`: human-named copies of the most relevant loaded CSS chunks.
- `fonts/`: Nohemi and Manrope files observed on the page.
- `raw-assets/`: complete bundle of 19 loaded stylesheets and 5 fonts, plus the URL manifest.

The `data-rect` attribute in the HTML snapshots is `x,y,width,height` in CSS pixels.

## Observed layout

| Region | Geometry | Notes |
| --- | --- | --- |
| Header | `8,12,1712,44` | Project title, plan/credits, Share, Export |
| Workspace | `8,68,1712,741` | Two-column editor + Agent shell |
| Editor | `8,68,940,741` | 54.9% of usable width |
| Asset panel | `8,68,292,391` | Media/Docs and Visual/BGM/Speech filters |
| Player | `300,68,648,391` | 9:16 canvas centered in a flexible stage |
| Timeline | `8,471,940,338` | Multi-track canvas-based editor |
| Agent panel | `960,68,760,741` | Tool transcript, tasks, composer |
| Composer/task tray | `969,540,743,261` | Fixed lower region over the Agent stream |

Key visual values:

- Base font: Manrope, `14px / 18px`; display font: Nohemi.
- App background: `#161318` / `#161419`.
- Elevated player surface: approximately `#26222a`.
- Deep tray surface: approximately `#0c090f`.
- Main text: approximately `#e5e2e8`.
- Outline: approximately `#403c47`.
- Primary: `#863dfb`; brighter tint: `#ddb7ff`.
- Large panels use roughly `20px` radius and `8–16px` internal gaps.

## Relevant CSS chunks

- `entry-web-CtggdL7i.css`: global theme, resets, typography, and design tokens.
- `bootstrap-CenMDhav.css` and `bootstrap-CXABye54.css`: application/component bootstrap layers.
- `AppShellPage-DS9azDnN.css`: shell-level layout.
- `CreationSpaceTray-CzHofSwq.css`: Agent/task tray.
- `CreationProgressSweepBar-DpXl3Ssn.css`: long-running creation progress treatment.
- `CommandBox-p94R5QZA.css` and `rich-input-DaZiZlVy.css`: prompt composer.

## Monitored workflow

The observed request produced a 30.18-second vertical video:

1. Script and three-scene storyboard.
2. Character and Home Bar reference images.
3. Three parallel Seedance 2.5 clips: 8s, 10s, and 12s.
4. Timeline assembly.
5. Suno 5.5 BGM generation and timeline update.

The video stage showed one automatic retry after roughly five minutes, then recovered without user action. The final run completed all four tasks in about 13m50s.

## High-value optimization demo direction

Build a lightweight “Agent Mission Control” layer around the existing editor:

- Replace the contradictory `Tasks(0/4)`, `Tasks(2/4)`, and later `Tasks(4/4)` labels with one authoritative stage model.
- Show each parallel clip as its own row with state, elapsed time, retry count, cost, and dependency.
- Separate the human-facing plan/output from the verbose tool transcript; collapse prompts and tool internals by default.
- Preserve completed output while a downstream step runs, so the interface feels progressively usable instead of blocked.
- Explain disabled actions such as Export with a concrete reason and the stage that unlocks them.
- Turn automatic retries into explicit recovery states instead of resetting or duplicating timers.

This direction keeps the original visual language and editor layout, while demonstrating clearer async orchestration—a strong front-end/product story for an AI Agent interview demo.
