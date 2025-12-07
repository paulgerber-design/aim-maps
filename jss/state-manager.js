/**
 * AIM Viewer State Manager
 * Manages application state and navigation
 * v1.0.0
 */

const AIMState = (function() {
  'use strict';

  // ==========================================================================
  // Private State
  // ==========================================================================

  /** Current AIM data */
  let aimData = null;

  /** 
   * Current view state
   * A = Full view (all pillars)
   * B = Pillar focus (one pillar expanded)
   * C = Sub focus (one sub expanded)
   */
  let currentState = 'A';

  /** Selected pillar index (1-3) when in state B or C */
  let selectedPillar = null;

  /** Selected sub index (1-3) when in state C */
  let selectedSub = null;

  /** Pre-selected sub for hover highlighting */
  let preselectedSub = null;

  /** Current heatmap type ('off', 'confidence', 'ac', 'ce', 'cx') */
  let heatmapType = 'off';

  /** Whether editing is enabled */
  let editingEnabled = false;

  /** Current tab ('aim' or 'projects') */
  let currentTab = 'aim';

  /** State change listeners */
  const listeners = [];

  // ==========================================================================
  // State Getters
  // ==========================================================================

  function getData() {
    return aimData;
  }

  function getState() {
    return currentState;
  }

  function getSelectedPillar() {
    return selectedPillar;
  }

  function getSelectedSub() {
    return selectedSub;
  }

  function getPreselectedSub() {
    return preselectedSub;
  }

  function getHeatmapType() {
    return heatmapType;
  }

  function isEditingEnabled() {
    return editingEnabled;
  }

  function getCurrentTab() {
    return currentTab;
  }

  // ==========================================================================
  // State Setters (with notification)
  // ==========================================================================

  function setData(data) {
    aimData = data;
    notifyListeners('data', data);
  }

  function setState(state) {
    if (state !== 'A' && state !== 'B' && state !== 'C') {
      console.warn('Invalid state:', state);
      return;
    }
    const oldState = currentState;
    currentState = state;
    notifyListeners('state', { oldState, newState: state });
  }

  function setSelectedPillar(pillar) {
    selectedPillar = pillar;
    notifyListeners('pillar', pillar);
  }

  function setSelectedSub(sub) {
    selectedSub = sub;
    notifyListeners('sub', sub);
  }

  function setPreselectedSub(sub) {
    preselectedSub = sub;
    notifyListeners('preselectedSub', sub);
  }

  function setHeatmapType(type) {
    heatmapType = type;
    notifyListeners('heatmap', type);
  }

  function setEditingEnabled(enabled) {
    editingEnabled = enabled;
    notifyListeners('editing', enabled);
  }

  function setCurrentTab(tab) {
    currentTab = tab;
    notifyListeners('tab', tab);
  }

  // ==========================================================================
  // Navigation Actions
  // ==========================================================================

  /**
   * Navigate to full view (state A)
   */
  function navigateToFullView() {
    currentState = 'A';
    selectedPillar = null;
    selectedSub = null;
    preselectedSub = null;
    notifyListeners('navigation', { state: 'A' });
  }

  /**
   * Navigate to pillar view (state B)
   * @param {number} pillar - Pillar index (1-3)
   */
  function navigateToPillar(pillar) {
    if (pillar < 1 || pillar > 3) {
      console.warn('Invalid pillar index:', pillar);
      return;
    }
    currentState = 'B';
    selectedPillar = pillar;
    selectedSub = null;
    preselectedSub = null;
    notifyListeners('navigation', { state: 'B', pillar });
  }

  /**
   * Navigate to sub view (state C)
   * @param {number} pillar - Pillar index (1-3)
   * @param {number} sub - Sub index (1-3)
   */
  function navigateToSub(pillar, sub) {
    if (pillar < 1 || pillar > 3 || sub < 1 || sub > 3) {
      console.warn('Invalid pillar/sub index:', pillar, sub);
      return;
    }
    currentState = 'C';
    selectedPillar = pillar;
    selectedSub = sub;
    preselectedSub = null;
    notifyListeners('navigation', { state: 'C', pillar, sub });
  }

  /**
   * Navigate up one level
   */
  function navigateUp() {
    if (currentState === 'C') {
      navigateToPillar(selectedPillar);
    } else if (currentState === 'B') {
      navigateToFullView();
    }
  }

  /**
   * Get current breadcrumb data
   * @returns {Object} - Breadcrumb information
   */
  function getBreadcrumbData() {
    const crumbs = [{ label: 'AIM', action: navigateToFullView }];
    
    if (!aimData) return { crumbs, current: 'AIM' };

    if (currentState === 'B' || currentState === 'C') {
      const pillarName = aimData.pillarNames[selectedPillar] || `Pillar ${selectedPillar}`;
      crumbs.push({ 
        label: pillarName, 
        action: () => navigateToPillar(selectedPillar) 
      });
    }

    if (currentState === 'C') {
      const subData = aimData.subs[selectedPillar]?.[selectedSub];
      const subTitle = subData?.title || `Sub ${selectedSub}`;
      crumbs.push({ label: subTitle, action: null }); // Current level, no action
    }

    return {
      crumbs,
      current: crumbs[crumbs.length - 1].label
    };
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  /**
   * Add a state change listener
   * @param {Function} callback - Function to call on state change
   * @returns {Function} - Unsubscribe function
   */
  function subscribe(callback) {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of a state change
   * @param {string} type - Type of change
   * @param {*} payload - Change payload
   */
  function notifyListeners(type, payload) {
    listeners.forEach(callback => {
      try {
        callback(type, payload);
      } catch (e) {
        console.error('State listener error:', e);
      }
    });
  }

  // ==========================================================================
  // Reset
  // ==========================================================================

  /**
   * Reset all state to defaults
   */
  function reset() {
    aimData = null;
    currentState = 'A';
    selectedPillar = null;
    selectedSub = null;
    preselectedSub = null;
    heatmapType = 'off';
    editingEnabled = false;
    currentTab = 'aim';
    notifyListeners('reset', null);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    // Getters
    getData,
    getState,
    getSelectedPillar,
    getSelectedSub,
    getPreselectedSub,
    getHeatmapType,
    isEditingEnabled,
    getCurrentTab,
    getBreadcrumbData,
    
    // Setters
    setData,
    setState,
    setSelectedPillar,
    setSelectedSub,
    setPreselectedSub,
    setHeatmapType,
    setEditingEnabled,
    setCurrentTab,
    
    // Navigation
    navigateToFullView,
    navigateToPillar,
    navigateToSub,
    navigateUp,
    
    // Events
    subscribe,
    
    // Reset
    reset
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIMState;
}
