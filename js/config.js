/**
 * AIM Viewer Configuration
 * Centralized constants and settings
 * v2.0.0 - Phase 5a: Renamed poles, AIM ONE integration
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
    '#88c6cb',  // Pillar 1: Teal (Outer Self)
    '#c6a4d4',  // Pillar 2: Purple (Inner Self)
    '#f0c27b'   // Pillar 3: Gold (Relationships)
  ],
  
  /** Color for incomplete/empty segments */
  incompleteColor: '#e8e8e8',
  
  /** Pattern for incomplete segments */
  incompletePattern: 'diagonal',
  
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
  // Pole Configuration (Renamed in v2.0.0)
  // ==========================================================================
  
  /** Pole axis definitions */
  poles: {
    adapting: {
      key: 'ac',
      name: 'Adapting',
      shortName: 'Adapting',
      left: { letter: 'F', name: 'Fixed' },
      right: { letter: 'G', name: 'Guided' },
      description: 'How you prefer to grow: self-directed (Fixed) vs. welcoming external guidance (Guided)',
      philosophy: 'Fixed learners thrive with autonomy and self-paced exploration. Guided learners flourish with mentorship and structured feedback. Neither is better—knowing your preference helps design the right growth environment.'
    },
    celebrating: {
      key: 'ce',
      name: 'Celebrating',
      shortName: 'Celebrating',
      left: { letter: 'R', name: 'Results' },
      right: { letter: 'P', name: 'Practice' },
      description: 'What energizes you: achieving outcomes (Results) vs. enjoying the process (Practice)',
      philosophy: 'Results-oriented people are motivated by milestones and achievements. Practice-oriented people find joy in the daily ritual itself. Understanding this shapes how we frame goals and measure progress.'
    },
    connecting: {
      key: 'cx',
      name: 'Connecting',
      shortName: 'Connecting',
      left: { letter: 'A', name: 'Autonomous' },
      right: { letter: 'S', name: 'Synchronized' },
      description: 'How you prefer to engage: independently (Autonomous) vs. with others (Synchronized)',
      philosophy: 'Autonomous people recharge alone and do deep work in solitude. Synchronized people gain energy from collaboration and shared experiences. Both are valid paths to growth and fulfillment.'
    }
  },
  
  /** Legacy key mapping (for CSV compatibility) */
  poleKeyMap: {
    'ac': 'adapting',
    'ce': 'celebrating', 
    'cx': 'connecting',
    'pole_gf': 'adapting',
    'pole_pr': 'celebrating',
    'pole_sa': 'connecting'
  },
  
  /** Magnitude labels for pole values */
  poleMagnitudeLabels: {
    0: 'balanced',
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
    adapting: {
      label: 'Adapting',
      description: 'Fixed (self-directed) ↔ Guided (welcomes direction)'
    },
    celebrating: {
      label: 'Celebrating',
      description: 'Results (outcomes) ↔ Practice (the journey)'
    },
    connecting: {
      label: 'Connecting',
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
  
  /** Default number of project recommendations to show */
  projectsInitialDisplay: 1,
  
  /** Additional projects to show on "show more" */
  projectsExpandedDisplay: 3,
  
  /** Project type labels */
  projectTypes: {
    practice: { label: 'Practice', description: 'Ongoing habit or routine' },
    sprint: { label: 'Sprint', description: 'Time-boxed goal' }
  },
  
  // ==========================================================================
  // AIM ONE Integration
  // ==========================================================================
  
  /** AIM ONE Claude Project ID */
  aimOneProjectId: '019ac79c-20d1-73ea-8e1e-05d90fbbdd94',
  
  /** Base URL for AIM ONE */
  aimOneBaseUrl: 'https://claude.ai/project/',
  
  /** Get full AIM ONE URL */
  getAimOneUrl: function(focus) {
    const base = this.aimOneBaseUrl + this.aimOneProjectId;
    if (focus) {
      return base + '?focus=' + encodeURIComponent(focus);
    }
    return base;
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
  transitionDuration: 300,
  
  // ==========================================================================
  // Modal Messages
  // ==========================================================================
  
  /** Message templates for incomplete data modal */
  incompleteMessages: {
    generic: "Let's explore a little more to understand you better.",
    pillar: "Let's explore a little more about your {pillarName}.",
    cta: "Continue with AIM ONE",
    benefit: "Easy questions for you. Personalized insights for your growth."
  }
};

// Don't freeze - we have a method that needs to work
// Instead, just export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIM_CONFIG;
}
