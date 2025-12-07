/**
 * AIM Viewer Configuration
 * Centralized constants and settings
 * v1.0.0
 */

const AIM_CONFIG = {
  // ==========================================================================
  // Display Settings
  // ==========================================================================
  
  /** Maximum characters for text display by depth level */
  maxCharsByDepth: {
    1: 45,  // Pillar level
    2: 35,  // Sub level
    3: 25   // Micro level
  },
  
  /** Maximum characters for center belief text */
  centerBeliefMaxChars: 120,
  
  /** Line gap for center text (pixels) */
  centerLineGap: 4,
  
  // ==========================================================================
  // Colors
  // ==========================================================================
  
  /** Base colors for each pillar (index 0-2 maps to pillars 1-3) */
  pillarColors: [
    '#88c6cb',  // Pillar 1: Teal
    '#c6a4d4',  // Pillar 2: Purple
    '#f0c27b'   // Pillar 3: Gold
  ],
  
  /** Alpha values for depth levels (creates visual hierarchy) */
  depthAlpha: {
    1: 0.25,  // Pillar ring
    2: 0.20,  // Sub ring
    3: 0.18   // Micro ring
  },
  
  /** Heatmap blend ratio (0-1, how much heat color mixes with base) */
  heatBlendRatio: 1.0,
  
  // ==========================================================================
  // Alignment/Confidence Categories
  // ==========================================================================
  
  /** Categories for alignment scores with display labels */
  alignmentCategories: [
    { min: 0,  max: 19,  label: 'Very Low',    color: '#e74c3c' },
    { min: 20, max: 39,  label: 'Low',         color: '#e67e22' },
    { min: 40, max: 59,  label: 'Moderate',    color: '#f1c40f' },
    { min: 60, max: 79,  label: 'Good',        color: '#2ecc71' },
    { min: 80, max: 100, label: 'Strong',      color: '#27ae60' }
  ],
  
  // ==========================================================================
  // Pole Configuration
  // ==========================================================================
  
  /** Pole axis definitions */
  poles: {
    ac: {
      name: 'Adaptive Challenge',
      shortName: 'Adaptive',
      left: { letter: 'F', name: 'Fixed' },
      right: { letter: 'G', name: 'Guided' },
      description: 'How you prefer to be challenged: self-directed vs. externally guided'
    },
    ce: {
      name: 'Celebration',
      shortName: 'Celebration',
      left: { letter: 'R', name: 'Results' },
      right: { letter: 'P', name: 'Practice' },
      description: 'What you celebrate: destinations/outcomes vs. the process/practice'
    },
    cx: {
      name: 'Collective Experience',
      shortName: 'Collective',
      left: { letter: 'A', name: 'Autonomous' },
      right: { letter: 'S', name: 'Synchronized' },
      description: 'How you prefer to work: independently vs. with others'
    }
  },
  
  /** Magnitude labels for pole values */
  poleMagnitudeLabels: {
    0: 'middle',
    1: 'leans',
    2: 'mostly',
    3: 'clearly'
  },
  
  // ==========================================================================
  // Heatmap Configuration
  // ==========================================================================
  
  /** Available heatmap types */
  heatmapTypes: {
    off: {
      label: 'Off',
      description: 'No heatmap overlay'
    },
    confidence: {
      label: 'Alignment',
      description: 'How well each belief aligns with your actions (0-100)'
    },
    ac: {
      label: 'Adaptive Challenge',
      description: 'Fixed (self-paced) ↔ Guided (welcomes direction)'
    },
    ce: {
      label: 'Celebration',
      description: 'Results (finish line) ↔ Practice (the journey)'
    },
    cx: {
      label: 'Collective Experience',
      description: 'Autonomous (solo) ↔ Synchronized (together)'
    }
  },
  
  // ==========================================================================
  // Mode Configuration
  // ==========================================================================
  
  /** Pillar names by mode */
  pillarNames: {
    personal: ['Outer Self', 'Inner Self', 'Relationships'],
    business: ['Team', 'Finance', 'Customer']
  },
  
  // ==========================================================================
  // Project Settings
  // ==========================================================================
  
  /** Default number of projects to show before "Show more" */
  projectsInitialDisplay: 5,
  
  /** Project type labels */
  projectTypes: {
    practice: { label: 'Practice', description: 'Ongoing habit or routine' },
    sprint: { label: 'Sprint', description: 'Time-boxed goal' }
  },
  
  // ==========================================================================
  // Viewer URLs
  // ==========================================================================
  
  /** Base URL for the viewer (used in shareable links) */
  viewerBaseUrl: 'https://paulgerber-design.github.io/aim-maps/index.html',
  
  // ==========================================================================
  // Animation Settings
  // ==========================================================================
  
  /** Duration for flash/highlight animations (ms) */
  flashDuration: 600,
  
  /** Transition duration for chart updates (ms) */
  transitionDuration: 300
};

// Freeze config to prevent accidental modification
Object.freeze(AIM_CONFIG);
Object.freeze(AIM_CONFIG.maxCharsByDepth);
Object.freeze(AIM_CONFIG.pillarColors);
Object.freeze(AIM_CONFIG.depthAlpha);
Object.freeze(AIM_CONFIG.alignmentCategories);
Object.freeze(AIM_CONFIG.poles);
Object.freeze(AIM_CONFIG.poleMagnitudeLabels);
Object.freeze(AIM_CONFIG.heatmapTypes);
Object.freeze(AIM_CONFIG.pillarNames);
Object.freeze(AIM_CONFIG.projectTypes);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIM_CONFIG;
}
