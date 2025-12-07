/**
 * AIM Viewer Utilities
 * Helper functions for formatting, labels, and common operations
 * v1.0.0
 */

const AIMUtils = (function() {
  'use strict';

  /**
   * Get alignment category label for a confidence value
   * @param {number} val - Confidence value (0-100)
   * @returns {string} - Category label
   */
  function getAlignmentLabel(val) {
    const v = Math.max(0, Math.min(100, val));
    const categories = AIM_CONFIG.alignmentCategories;
    for (const cat of categories) {
      if (v >= cat.min && v <= cat.max) {
        return cat.label;
      }
    }
    return 'Unknown';
  }

  /**
   * Get alignment category color for a confidence value
   * @param {number} val - Confidence value (0-100)
   * @returns {string} - Category color
   */
  function getAlignmentColor(val) {
    const v = Math.max(0, Math.min(100, val));
    const categories = AIM_CONFIG.alignmentCategories;
    for (const cat of categories) {
      if (v >= cat.min && v <= cat.max) {
        return cat.color;
      }
    }
    return '#999';
  }

  /**
   * Format a date string for display
   * @param {string} str - ISO date string or similar
   * @returns {string} - Formatted date string
   */
  function formatDateString(str) {
    if (!str) return '';
    try {
      const date = new Date(str);
      if (isNaN(date.getTime())) return str;
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString(undefined, options);
    } catch (e) {
      return str;
    }
  }

  /**
   * Get human-readable phrase for a pole value
   * @param {number} val - Pole value (-3 to +3)
   * @param {string} letter - Orientation letter
   * @param {string} type - Pole type ('ac', 'ce', 'cx')
   * @returns {string} - Human-readable phrase
   */
  function getPolePhrase(val, letter, type) {
    if (val === null || val === undefined) return '';
    
    const poleConfig = AIM_CONFIG.poles[type];
    if (!poleConfig) return '';

    const abs = Math.abs(val);
    const magnitudeLabel = AIM_CONFIG.poleMagnitudeLabels[abs] || '';
    
    // Determine which pole name to use based on letter or value sign
    let poleName = '';
    if (letter) {
      if (letter === poleConfig.left.letter) {
        poleName = poleConfig.left.name;
      } else if (letter === poleConfig.right.letter) {
        poleName = poleConfig.right.name;
      }
    }
    
    // Fall back to value sign if letter didn't match
    if (!poleName && val !== 0) {
      poleName = val < 0 ? poleConfig.left.name : poleConfig.right.name;
    }

    if (abs === 0) {
      return 'middle';
    }
    
    return magnitudeLabel && poleName ? `${magnitudeLabel} ${poleName}` : poleName || magnitudeLabel;
  }

  /**
   * Compute heatmap color for a confidence value
   * @param {number} conf - Confidence value (0-100)
   * @returns {string} - RGB color string
   */
  function computeHeatColor(conf) {
    const ratio = Math.max(0, Math.min(100, conf)) / 100;
    const hue = 120 * ratio; // 0 (red) to 120 (green)
    // Use d3 if available, otherwise approximate
    if (typeof d3 !== 'undefined') {
      const hslColor = d3.hsl(hue, 0.65, 0.45);
      const rgb = hslColor.rgb();
      return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
    }
    // Fallback approximation
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    return `rgb(${r}, ${g}, 0)`;
  }

  /**
   * Truncate text to a maximum length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxChars - Maximum characters
   * @returns {string} - Truncated text
   */
  function truncateText(text, maxChars) {
    if (!text || text.length <= maxChars) return text;
    return text.substring(0, maxChars - 1) + '…';
  }

  /**
   * Wrap text into lines of maximum length
   * @param {string} text - Text to wrap
   * @param {number} maxLen - Maximum line length
   * @returns {string[]} - Array of lines
   */
  function wrapLines(text, maxLen) {
    if (!text) return [];
    
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length === 0) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxLen) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Sanitize a string for use as a filename
   * @param {string} str - String to sanitize
   * @param {number} maxLen - Maximum length (default 50)
   * @returns {string} - Sanitized filename
   */
  function sanitizeFilename(str, maxLen = 50) {
    if (!str) return 'aim_export';
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, maxLen) || 'aim_export';
  }

  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Debounce a function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} - Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Parse priority string to numeric value for sorting
   * @param {string} str - Priority string (e.g., "P0", "P1", "High")
   * @returns {number} - Numeric priority (lower = higher priority)
   */
  function parsePriority(str) {
    if (!str) return 999;
    const s = String(str).trim().toLowerCase();
    
    // Handle P-codes
    const pMatch = s.match(/^p(\d+)/i);
    if (pMatch) return parseInt(pMatch[1]);
    
    // Handle text priorities
    if (s.includes('top') || s.includes('high') || s === '1') return 0;
    if (s.includes('medium') || s.includes('mid') || s === '2') return 50;
    if (s.includes('low') || s === '3') return 100;
    
    return 999;
  }

  /**
   * Generate a breadcrumb path string
   * @param {Object} data - AIM data object
   * @param {number} pillar - Pillar index (1-3)
   * @param {number} [sub] - Sub index (1-3)
   * @param {number} [micro] - Micro index (1-3)
   * @returns {string} - Breadcrumb path
   */
  function getBreadcrumb(data, pillar, sub, micro) {
    const parts = ['AIM'];
    
    if (pillar && data.pillarNames[pillar]) {
      parts.push(data.pillarNames[pillar]);
    }
    
    if (sub && data.subs[pillar] && data.subs[pillar][sub]) {
      const subTitle = data.subs[pillar][sub].title;
      if (subTitle) parts.push(subTitle);
    }
    
    if (micro && data.micros[pillar] && data.micros[pillar][sub] && data.micros[pillar][sub][micro]) {
      const microTitle = data.micros[pillar][sub][micro].title;
      if (microTitle) parts.push(microTitle);
    }
    
    return parts.join(' › ');
  }

  // Public API
  return {
    getAlignmentLabel,
    getAlignmentColor,
    formatDateString,
    getPolePhrase,
    computeHeatColor,
    truncateText,
    wrapLines,
    sanitizeFilename,
    deepClone,
    debounce,
    parsePriority,
    getBreadcrumb
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIMUtils;
}
