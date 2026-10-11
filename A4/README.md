# 23CSE455 Design Patterns Case Study — Team A4

## Project Metadata
- **Course**: 23CSE455 Design Patterns
- **Team**: A4
- **Domain**: Home Automation / Dashboard Architecture
- **Application**: [ha-fusion](https://github.com/knowald/ha-fusion)
- **Baseline Commit**: `65cc1957c39c6005609102c33650c32abc8d12f0`
- **Baseline Date**: October 2026
- **License**: MIT License

---

## Student Information

| Roll Number | Student Name | Batch | Role / Contribution |
| :--- | :--- | :--- | :--- |
| `[Roll Number 1]` | `[Student Name 1]` | `CSE A` | Part 1 Discovery & Verification Lead |
| `[Roll Number 2]` | `[Student Name 2]` | `CSE A` | Part 2 Evolution & Refactoring (CH01–CH03) |
| `[Roll Number 3]` | `[Student Name 3]` | `CSE A` | Part 3 Cross-Language Implementation & Report |

*(Replace bracketed placeholders with actual team details before final submission)*

---

## Environment & Toolchain Versions

| Tool / Runtime | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v22.15.0` | JavaScript / TypeScript runtime |
| **pnpm** | `12.11.2` | Package manager |
| **Svelte** | `5.56.8` | Reactive UI framework |
| **SvelteKit** | `2.69.2` | Application framework and server routes |
| **Vite** | `8.1.4` | Build tool and bundler |
| **Vitest** | `4.1.10` | Unit test execution |
| **cloc** | `2.10` | Source Lines of Code (LOC) counter |
| **lizard** | `1.24.1` | Cyclomatic complexity analyzer |

---

## Inspection Scope

### Inspected Modules
- `src/lib/Stores.ts`: Global reactive stores, undo/redo history store, and WebSocket entity subscriptions.
- `src/lib/Drawer/HistoryButtons.svelte`: Classic dashboard layout undo/redo Caretaker and snapshot operations.
- `src/lib/Hearth/store.ts`: Hearth UI configuration store, undo/redo stacks, and edit-mode transactional snapshot.
- `src/lib/Hearth/config.ts`: Hearth configuration interfaces, type registries (`RAIL_WIDGET_TYPES`, `OVERVIEW_CARD_TYPES`).
- `src/lib/Hearth/modals.ts`: Entity domain modal parameterized Factory Method.
- `src/lib/Hearth/CardRenderer.svelte`: Polymorphic overview card rendering Strategy/dispatcher.
- `src/lib/Hearth/RailWidgetRenderer.svelte`: Polymorphic rail widget rendering Strategy/dispatcher.
- `src/lib/Conditional.ts` & `src/lib/Types.ts`: Recursive visibility condition tree (Composite / Interpreter pattern).
- `src/lib/Utils.ts`: Dashboard section hierarchy traversal (`findInSections`).
- `src/lib/Modal/PictureElements/konvaBase.ts`, `konvaEditor.ts`, `konvaViewer.ts`: Picture Elements canvas editor (Template Method and Canvas Memento).
- `src/lib/Socket.ts`: Home Assistant WebSocket connection and entity state observer subscription.
- `src/routes/**`: Server routes, translation handlers, and Hearth persistence API endpoints.

### Excluded Modules
- `node_modules/`: External library dependencies.
- `static/`: Static assets (weather SVG icons, theme YAML files, localization JSON dictionaries).
- Build and linter configuration files (`.prettierrc`, `eslint.config.js`, `svelte.config.js`, `vite.config.ts`, `Dockerfile`).

---

## Baseline Verification & Execution Commands

### Dependency Installation
```bash
pnpm install
```

### Running Test Suite
```bash
pnpm test
```
**Baseline Test Result**:
- Test Files: **13 passed (13)**
- Tests: **46 passed (46)**
- Execution Time: **862ms**
- Log file: `data/test_result/baseline_test.log`

### LOC Measurement
```bash
cloc src/
```
**Baseline LOC Breakdown** (measured with `cloc 2.10` on `ha-baseline/src`):
```text
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Svelte                         261           5232           1862          39908
TypeScript                      64           1277           1157           9112
CSS                              3             43             18            238
Markdown                         1             32              0            104
HTML                             1              0              0             15
-------------------------------------------------------------------------------
SUM:                           330           6584           3037          49377
-------------------------------------------------------------------------------
```

### Cyclomatic Complexity Measurement
```bash
lizard src/lib/Conditional.ts
```

---

## Repository & Dataset Structure

Per the course guidelines, datasets are consolidated in `data/` to ensure single-source-of-truth consistency across parts:

```text
A4/
|-- README.md                         # This file: metadata, versions, commands, scope
|-- A4_Report.tex                     # LaTeX report source
|-- A4_Report.pdf                     # Compiled PDF report
|-- data/
|   |-- code/                         # Untouched baseline application source (no node_modules, no .git)
|   |-- test_result/                  # Actual test logs and execution records
|   |-- patterns.csv                  # Existing baseline inventory; Part 1 re-audit deferred
|   |-- pattern_counts.csv            # Tracked counts by pattern and source version
|   |-- patterns_evolution.csv        # Part 2: Evolution tracking across baseline and CH01-CH03
|   |-- pattern_candidate_observations.csv # Rejected/uncertain candidate evidence
|   |-- cross_language.csv            # Part 3: Cross-language re-implementations and timing
|   `-- llm.csv                       # AI interaction logging with verification and evaluation
|-- Part1/
|   |-- pattern_architecture/         # Architecture and pattern UML diagram sources & images
|   |-- Part1_prompt.txt              # Exact prompts used during discovery
|   `-- llm/                          # Raw inputs, outputs, and verification files
|-- Part2/
|   |-- Part2_Report.md               # Draft-ready report section for template sections 3 and 3.1
|   |-- Part2_Report.pdf              # Rendered Part 2 report section
|   |-- evolution_metrics.csv         # Per-change source LOC and cyclomatic complexity evidence
|   |-- evolution_evidence_notes.md   # Snapshot, counting, and audit-scope notes
|   |-- diagrams/                     # Updated evolution diagram sources and SVG rendering
|   |-- evidence/                      # Index to diffs, logs, snapshots, and datasets
|   |-- llm/                           # LLM-record availability note; historical raw records absent
|   |-- code/
|   |   |-- snapshots/                # Versioned CH01 and CH02 source snapshots
|   |   `-- changes/
|   |       |-- Change1/              # Requirement, criteria, diff, and vitest log for CH01
|   |       |-- Change2/              # Requirement, criteria, diff, and vitest log for CH02
|   |       `-- Change3/              # Requirement, criteria, diff, and vitest log for CH03
|   |-- diagrams/                     # Updated UML diagrams reflecting evolved architecture
|   |-- Part2_prompt.text             # Exact prompts used during evolution
|   `-- llm/                          # Raw inputs, outputs, and verification files
`-- Part3/
    |-- snippets/                     # Java, Python, JavaScript, and C++ implementations
    `-- llm/                          # Prompts and verification logs
```
