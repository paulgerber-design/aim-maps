# AIM Viewer - Phase 5a

## Overview

Phase 5a introduces a new user-focused layout with collapsible sections, incomplete data indicators, and AIM ONE integration.

## What's New

### 1. New Page Layout
- **Single-page flow**: AIM sunburst → Project Recommendations → Insights
- **Collapsible sections**: Projects and Insights are collapsed by default
- **Breadcrumb navigation**: Easy navigation between pillar views

### 2. Incomplete Data Indicators
- Visual pattern overlay on segments without belief text
- Click incomplete segment → Modal with "Continue in AIM ONE" option
- Legend shows completion progress (e.g., "4/13") for each pillar

### 3. Renamed Pole Axes
| Old Name | New Name |
|----------|----------|
| Adaptive Challenge | Adapting |
| Celebration | Celebrating |
| Collective Experience | Connecting |

Pole endpoints remain the same:
- **Adapting**: Fixed ↔ Guided
- **Celebrating**: Results ↔ Practice
- **Connecting**: Autonomous ↔ Synchronized

### 4. Project Recommendations
- Shows top project per pillar (overall view) or top project for selected pillar
- "Not quite right? Show alternatives" reveals additional options
- New `project_rationale` field for explaining why each project is recommended

### 5. AIM ONE Integration
- "Refine in AIM ONE" button in header (pencil icon)
- Clicking incomplete segments opens modal with AIM ONE link
- URL includes focus parameter: `?focus=pillar:1`

### 6. New CSV Schema Fields
```csv
# Project fields
project_rationale  # Why this project is recommended

# Insight fields (12 total)
insight_overview
insight_observations
insight_projects
insight_pillar_1_overview
insight_pillar_1_observations
insight_pillar_1_projects
insight_pillar_2_overview
insight_pillar_2_observations
insight_pillar_2_projects
insight_pillar_3_overview
insight_pillar_3_observations
insight_pillar_3_projects

# Priority now supports numeric
priority_ai  # Can be 1, 2, 3 (numeric) or P0, P1 (legacy)
```

## Installation

1. **Replace existing viewer files:**
   ```
   aim-viewer/
   ├── index.html
   ├── css/
   │   └── styles.css
   └── js/
       ├── config.js      (updated: poles renamed, AIM ONE config)
       ├── utils.js       (updated: completeness checks)
       ├── data-parser.js (updated: insight fields, project_rationale)
       ├── state-manager.js
       ├── chart-renderer.js (updated: incomplete indicators)
       └── app.js         (new: complete rewrite for new layout)
   ```

2. **Update AIM ONE Project ID** (if different):
   Edit `js/config.js` line ~152:
   ```javascript
   aimOneProjectId: '019ac79c-20d1-73ea-8e1e-05d90fbbdd94',
   ```

## Testing

Load the viewer with your test Gist:
```
index.html?gist=cdd870479c1c83443d52db0b11e4b712
```

### Test Checklist
- [ ] Incomplete segments show diagonal pattern
- [ ] Clicking incomplete segment opens modal
- [ ] "Continue with AIM ONE" button opens Claude project
- [ ] Breadcrumb shows pillar name when drilled in
- [ ] Legend shows completion badges (e.g., "4/13")
- [ ] Projects section collapses/expands
- [ ] Insights section collapses/expands
- [ ] "Refine in AIM ONE" button opens Claude project
- [ ] Heatmap dropdown shows new pole names

## Files Changed

| File | Changes |
|------|---------|
| `index.html` | Complete restructure - removed tabs, added collapsible sections, modal |
| `css/styles.css` | New layout styles, modal, collapsible sections, incomplete indicators |
| `js/config.js` | Renamed poles, AIM ONE config, incomplete messages |
| `js/utils.js` | Added completeness checking functions |
| `js/data-parser.js` | Added insight fields, project_rationale, numeric priority parsing |
| `js/chart-renderer.js` | Added incomplete pattern, onClick callback |
| `js/app.js` | Complete rewrite for new architecture |
| `js/state-manager.js` | No changes (copied from previous) |

## Next Steps (Phase 5b)

1. Update AIM ONE instruction files with:
   - New CSV fields (`project_rationale`, 12 insight fields)
   - Instructions for generating insights
   - Pole philosophy content

2. Update AIM ONE CSV schema documentation

---

*Version 2.0.0 - Phase 5a*
