# AIM Viewer — Refactored Architecture

## Overview

The original monolithic `index.html` (4,321 lines) has been split into modular files for better maintainability and AI-assisted development.

## File Structure

```
aim-viewer-refactored/
├── index.html          # Clean HTML structure only (~150 lines)
├── css/
│   └── styles.css      # All CSS extracted (~470 lines)
└── js/
    ├── config.js       # Centralized constants & settings (~180 lines)
    ├── utils.js        # Helper functions (~275 lines)
    ├── data-parser.js  # CSV parsing logic (~420 lines)
    ├── state-manager.js # Application state (~315 lines)
    └── app.js          # Main application logic (~720 lines)
```

## Module Descriptions

### `config.js` — AIM_CONFIG
Centralized configuration object containing:
- Display settings (max chars, line gaps)
- Colors (pillar colors, depth alpha values)
- Alignment categories with labels and colors
- Pole definitions (ac, ce, cx axes)
- Heatmap type definitions
- Mode-specific pillar names
- Animation settings

### `utils.js` — AIMUtils
Helper functions:
- `getAlignmentLabel(val)` — Get category label for confidence value
- `formatDateString(str)` — Format ISO dates for display
- `getPolePhrase(val, letter, type)` — Human-readable pole descriptions
- `computeHeatColor(conf)` — Calculate heatmap color
- `truncateText(text, maxChars)` — Truncate with ellipsis
- `wrapLines(text, maxLen)` — Word-wrap text
- `parsePriority(str)` — Parse priority strings for sorting
- `getBreadcrumb(data, pillar, sub, micro)` — Generate breadcrumb path

### `data-parser.js` — AIMDataParser
CSV parsing:
- `parseCSV(rows)` — Main parser, converts CSV rows to AIM data structure
- `parsePole(str)` — Parse combined pole format (e.g., "2G")
- `parseSplitPole(scoreStr, labelStr)` — Parse separate score/label columns
- Handles all row types: title, mode, pillar_name, core, pillar, sub, micro, lens, project

### `state-manager.js` — AIMState
Application state management:
- Navigation state (A/B/C views, selected pillar/sub)
- Heatmap type
- Editing mode
- Current tab
- Event subscription system for reactive updates
- Navigation actions (navigateToFullView, navigateToPillar, navigateToSub)

### `app.js` — AIMApp
Main application:
- DOM element caching
- Event listener setup
- Data loading from URL parameters (?csv=, ?gist=, ?data=)
- File upload handling
- Rendering coordination
- CSV export
- Keyboard shortcuts

## What's NOT Yet Migrated

The sunburst chart rendering logic is the most complex part (~1,500 lines in the original). The `app.js` includes a placeholder `updateChart()` function. To complete the migration:

1. Create `js/chart-renderer.js` with:
   - `computeRadii()` — Calculate ring dimensions
   - `computeArcDescriptors()` — Generate arc data
   - `updateChart()` — Main D3 rendering
   - `drawSeparators()` — Draw divider lines
   - `drawCenterText()` — Core belief display
   - `drawArcLabels()` — Text labels on arcs
   - Tooltip handlers
   - Click/hover interactions

2. Create `js/ui-handlers.js` with:
   - Table view building
   - Project card creation
   - Inline editing
   - Form builders

## Usage

### Development
Serve the directory with any static file server:
```bash
npx serve aim-viewer-refactored
# or
python -m http.server 8000
```

### Deployment
Upload all files maintaining the directory structure to your web host.

### For GitHub Pages
The file structure works directly with GitHub Pages. Just push to your repo.

## Benefits of This Architecture

1. **Easier AI Assistance** — Each module is focused and under 500 lines
2. **Clear Separation** — CSS, config, logic, and state are isolated
3. **Testable** — Modules can be tested independently
4. **Maintainable** — Changes to one area don't require understanding the whole codebase
5. **Extensible** — New features can be added as new modules

## Migration Path

To complete the migration from the original `index.html`:

1. ✅ Extract CSS → `styles.css`
2. ✅ Extract config → `config.js`
3. ✅ Extract utilities → `utils.js`
4. ✅ Extract data parsing → `data-parser.js`
5. ✅ Extract state management → `state-manager.js`
6. ✅ Create app shell → `app.js`
7. ⏳ Extract chart rendering → `chart-renderer.js` (TODO)
8. ⏳ Extract UI handlers → `ui-handlers.js` (TODO)

## Comparison

| Metric | Original | Refactored |
|--------|----------|------------|
| Files | 1 | 7 |
| Total lines | 4,321 | ~2,533 |
| Largest file | 4,321 | ~720 |
| CSS in JS | Mixed | Separated |
| Config scattered | Yes | Centralized |
| State management | Global vars | Module |
