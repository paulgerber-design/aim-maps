# AIM Viewer — Refactored Architecture

## Overview

The original monolithic `index.html` (4,321 lines) has been split into modular files for better maintainability and AI-assisted development.

## File Structure

```
aim-viewer-refactored/
├── index.html           # Clean HTML structure only (~160 lines)
├── css/
│   └── styles.css       # All CSS extracted (~470 lines)
└── js/
    ├── config.js        # Centralized constants & settings (~180 lines)
    ├── utils.js         # Helper functions (~275 lines)
    ├── data-parser.js   # CSV parsing logic (~420 lines)
    ├── state-manager.js # Application state (~315 lines)
    ├── chart-renderer.js # D3 sunburst visualization (~700 lines)
    └── app.js           # Main application logic (~550 lines)
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

### `chart-renderer.js` — AIMChartRenderer
D3 sunburst visualization:
- `init(refs)` — Initialize with DOM references
- `updateChart()` — Main rendering function
- `computeRadii()` — Calculate ring dimensions for each state
- `computeArcDescriptors()` — Generate arc data for current view
- `drawSeparators(g)` — Draw divider lines between wedges
- `drawCenterText(g)` — Core/pillar/sub belief display
- `drawArcLabels(g, descriptors)` — Text labels on arcs
- `addCenterHover(g)` — Center tooltip interaction
- `handleArcClick(d)` — Navigation on wedge click
- Tooltip functions (show, move, hide)
- Legend highlight effects
- Flash ring animation

### `app.js` — AIMApp
Main application:
- DOM element caching
- Event listener setup
- Data loading from URL parameters (?csv=, ?gist=, ?data=)
- File upload handling
- Rendering coordination
- CSV export
- Keyboard shortcuts
- Table view building

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

1. **Easier AI Assistance** — Each module is focused and under 700 lines
2. **Clear Separation** — CSS, config, logic, state, and rendering are isolated
3. **Testable** — Modules can be tested independently
4. **Maintainable** — Changes to one area don't require understanding the whole codebase
5. **Extensible** — New features can be added as new modules

## Migration Checklist

- ✅ Extract CSS → `styles.css`
- ✅ Extract config → `config.js`
- ✅ Extract utilities → `utils.js`
- ✅ Extract data parsing → `data-parser.js`
- ✅ Extract state management → `state-manager.js`
- ✅ Extract chart rendering → `chart-renderer.js`
- ✅ Create app shell → `app.js`

## Comparison

| Metric | Original | Refactored |
|--------|----------|------------|
| Files | 1 | 8 |
| Total lines | 4,321 | ~3,070 |
| Largest file | 4,321 | ~700 |
| CSS in JS | Mixed | Separated |
| Config scattered | Yes | Centralized |
| State management | Global vars | Module |
| Chart code | Inline | Dedicated module |

## URL Parameters

The viewer supports loading data via URL parameters:
- `?csv=filename.csv` — Load from a local/relative CSV file
- `?gist=GIST_ID` — Load from a GitHub Gist
- `?data=BASE64` — Load from base64-encoded CSV data
