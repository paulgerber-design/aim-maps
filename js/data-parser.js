/**
 * AIM Viewer Data Parser
 * Handles CSV parsing and data structure creation
 * v2.0.0 - Phase 5a: Support for insight fields, project_rationale, numeric priorities
 */

const AIMDataParser = (function() {
  'use strict';

  /**
   * Parse a pole value from combined format (e.g., "2G", "-1F")
   * @param {string} str - The pole string to parse
   * @returns {Object} - {value: number|null, letter: string|null}
   */
  function parsePole(str) {
    if (typeof str !== 'string' || str.trim() === '') {
      return { value: null, letter: null };
    }
    const s = str.trim();
    let match = s.match(/^(-?\d+)/);
    let val = null;
    if (match) {
      val = parseInt(match[1]);
    }
    let letter = null;
    const last = s[s.length - 1];
    if (/[A-Za-z]/.test(last)) {
      letter = last.toUpperCase();
    }
    return { value: isNaN(val) ? null : val, letter: letter };
  }

  /**
   * Parse separate score/label columns for poles
   * @param {string} scoreStr - The score value
   * @param {string} labelStr - The label value
   * @returns {Object} - {value: number|null, letter: string|null}
   */
  function parseSplitPole(scoreStr, labelStr) {
    let value = null;
    if (scoreStr !== undefined && scoreStr !== null && scoreStr !== '') {
      const num = parseInt(scoreStr);
      if (!isNaN(num)) value = num;
    }
    let letter = null;
    if (labelStr !== undefined && labelStr !== null) {
      const trimmed = String(labelStr).trim();
      if (trimmed.length === 1) {
        letter = trimmed.toUpperCase();
      }
    }
    return { value: value, letter: letter };
  }

  /**
   * Create an empty node structure with all fields
   * @returns {Object} - Empty node object
   */
  function createEmptyNode() {
    return {
      title: '',
      belief: '',
      confidence: 50,
      updated: '',
      pole_ac_value: null,
      pole_ac_letter: null,
      pole_ce_value: null,
      pole_ce_letter: null,
      pole_cx_value: null,
      pole_cx_letter: null,
      pole_ac_label: '',
      pole_ce_label: '',
      pole_cx_label: '',
      today_state: '',
      details: '',
      priority_human: '',
      priority_ai: ''
    };
  }

  /**
   * Extract common fields from a CSV row
   * @param {Object} row - CSV row object
   * @returns {Object} - Extracted fields
   */
  function extractRowFields(row) {
    const title = row.title !== undefined ? String(row.title).trim() : '';
    const updated = row.updated !== undefined ? String(row.updated).trim() : '';
    const belief = row.belief !== undefined ? String(row.belief).trim() : '';
    
    // Parse confidence
    let confidence = 50;
    if (row.confidence !== undefined && row.confidence !== '') {
      const num = parseFloat(row.confidence);
      if (!isNaN(num)) {
        confidence = Math.max(0, Math.min(100, num));
      }
    }

    // Parse poles - combined format
    let poleAc = parsePole(row.pole_ac);
    let poleCe = parsePole(row.pole_ce);
    let poleCx = parsePole(row.pole_cx);

    // Override with split format if present
    const splitAc = parseSplitPole(row.ac_score, row.ac_label);
    if (splitAc.value !== null || splitAc.letter !== null) {
      poleAc = {
        value: splitAc.value !== null ? splitAc.value : poleAc.value,
        letter: splitAc.letter !== null ? splitAc.letter : poleAc.letter
      };
    }

    const splitCelebration = parseSplitPole(row.cp_score, row.cp_label);
    if (splitCelebration.value !== null || splitCelebration.letter !== null) {
      poleCe = {
        value: splitCelebration.value !== null ? splitCelebration.value : poleCe.value,
        letter: splitCelebration.letter !== null ? splitCelebration.letter : poleCe.letter
      };
    }

    const splitCollective = parseSplitPole(row.ce_score, row.ce_label);
    if (splitCollective.value !== null || splitCollective.letter !== null) {
      poleCx = {
        value: splitCollective.value !== null ? splitCollective.value : poleCx.value,
        letter: splitCollective.letter !== null ? splitCollective.letter : poleCx.letter
      };
    }

    // Raw labels for display
    const poleAcLabel = row.ac_label !== undefined ? String(row.ac_label).trim() : '';
    const poleCeLabel = row.cp_label !== undefined ? String(row.cp_label).trim() : '';
    const poleCxLabel = row.ce_label !== undefined ? String(row.ce_label).trim() : '';

    // Optional fields
    const todayState = row.today_state !== undefined ? String(row.today_state).trim() : '';
    const details = row.details !== undefined ? String(row.details).trim() : '';
    const priorityUser = row.priority_user !== undefined ? String(row.priority_user).trim() : 
                         (row.priority_human !== undefined ? String(row.priority_human).trim() : '');
    const priorityAi = row.priority_ai !== undefined ? String(row.priority_ai).trim() : '';

    // Project fields
    const projectType = row.project_type !== undefined ? String(row.project_type).trim().toLowerCase() : '';
    const duration = row.duration !== undefined ? String(row.duration).trim() : '';
    const projectAction = row.project_action !== undefined ? String(row.project_action).trim() : '';
    const projectMeasure = row.project_measure !== undefined ? String(row.project_measure).trim() : '';
    const projectStart = row.project_start !== undefined && row.project_start !== '' ? parseFloat(row.project_start) : null;
    const projectTarget = row.project_target !== undefined && row.project_target !== '' ? parseFloat(row.project_target) : null;
    const projectDays = row.project_days_per_week !== undefined && row.project_days_per_week !== '' ? parseInt(row.project_days_per_week) : null;
    const projectBenefit = row.project_benefit !== undefined ? String(row.project_benefit).trim() : '';
    const projectOutcome = row.project_outcome !== undefined ? String(row.project_outcome).trim() : '';
    const projectAcceptance = row.project_acceptance !== undefined ? String(row.project_acceptance).trim() : '';
    const projectRef = row.project_ref !== undefined ? String(row.project_ref).trim() : '';
    const projectRationale = row.project_rationale !== undefined ? String(row.project_rationale).trim() : '';

    return {
      title,
      updated,
      belief,
      confidence,
      poleAc,
      poleCe,
      poleCx,
      poleAcLabel,
      poleCeLabel,
      poleCxLabel,
      todayState,
      details,
      priorityUser,
      priorityAi,
      projectType,
      duration,
      projectAction,
      projectMeasure,
      projectStart,
      projectTarget,
      projectDays,
      projectBenefit,
      projectOutcome,
      projectAcceptance,
      projectRef,
      projectRationale
    };
  }

  /**
   * Check if row has project data
   * @param {Object} fields - Extracted row fields
   * @returns {Object} - {hasLegacy: boolean, hasNew: boolean}
   */
  function hasProjectData(fields) {
    const hasLegacy = fields.projectAction || fields.projectMeasure || 
                      fields.projectStart !== null || fields.projectTarget !== null || 
                      fields.projectDays !== null || fields.projectBenefit;
    const hasNew = fields.projectOutcome || fields.projectAcceptance || fields.projectRef;
    return { hasLegacy, hasNew };
  }

  /**
   * Create a project object from fields
   * @param {Object} fields - Extracted row fields
   * @param {number|null} pillarIdx - Associated pillar index
   * @returns {Object} - Project object
   */
  function createProject(fields, pillarIdx) {
    const { hasLegacy } = hasProjectData(fields);
    
    // Parse priority_ai as number if possible
    let priorityAi = fields.priorityAi || '';
    if (priorityAi !== '') {
      const num = parseInt(priorityAi);
      if (!isNaN(num)) {
        priorityAi = num;
      }
    }
    
    return {
      name: fields.title || fields.projectAction || fields.belief || '',
      action: fields.projectAction || (fields.title || fields.belief),
      measure: fields.projectMeasure || '',
      start: fields.projectStart,
      target: fields.projectTarget,
      days: fields.projectDays,
      benefit: fields.projectBenefit || '',
      priority_user: fields.priorityUser || '',
      priority_ai: priorityAi,
      outcome: fields.projectOutcome || '',
      acceptance: fields.projectAcceptance || '',
      ref: fields.projectRef || '',
      project_rationale: fields.projectRationale || '',
      today_state: fields.todayState || '',
      details: fields.details || '',
      pillar: pillarIdx,
      type: fields.projectType || (hasLegacy ? 'practice' : ''),
      duration: fields.duration || ''
    };
  }

  /**
   * Apply node data from extracted fields
   * @param {Object} node - Target node object
   * @param {Object} fields - Extracted fields
   */
  function applyNodeData(node, fields) {
    node.title = fields.title || '';
    node.belief = fields.belief;
    node.confidence = fields.confidence;
    node.updated = fields.updated;
    node.pole_ac_value = fields.poleAc.value;
    node.pole_ac_letter = fields.poleAc.letter;
    node.pole_ce_value = fields.poleCe.value;
    node.pole_ce_letter = fields.poleCe.letter;
    node.pole_cx_value = fields.poleCx.value;
    node.pole_cx_letter = fields.poleCx.letter;
    node.pole_ac_label = fields.poleAcLabel;
    node.pole_ce_label = fields.poleCeLabel;
    node.pole_cx_label = fields.poleCxLabel;
    node.today_state = fields.todayState;
    node.details = fields.details;
    node.priority_human = fields.priorityUser;
    node.priority_ai = fields.priorityAi;
  }

  /**
   * Parse CSV rows into AIM data structure
   * @param {Array} rows - Array of CSV row objects
   * @returns {Object} - Parsed AIM data
   */
  function parseCSV(rows) {
    const data = {
      title: '',
      mode: 'business',
      pillarNames: {},
      core: { label: '', belief: '', confidence: 50 },
      pillars: {},
      subs: {},
      micros: {},
      lenses: [],
      projects: [],
      // Insight fields - overall
      insight_overview: '',
      insight_observations: '',
      insight_projects: '',
      // Insight fields - per pillar
      insight_pillar_1_overview: '',
      insight_pillar_1_observations: '',
      insight_pillar_1_projects: '',
      insight_pillar_2_overview: '',
      insight_pillar_2_observations: '',
      insight_pillar_2_projects: '',
      insight_pillar_3_overview: '',
      insight_pillar_3_observations: '',
      insight_pillar_3_projects: ''
    };

    rows.forEach(row => {
      if (!row.label) return;
      
      const label = String(row.label).trim().toLowerCase();
      const fields = extractRowFields(row);
      const projectData = hasProjectData(fields);

      // Handle standalone project rows
      if (label === 'project') {
        if (projectData.hasLegacy || projectData.hasNew || fields.projectType || fields.duration) {
          let pillarIdx = null;
          if (row.pillar !== undefined && row.pillar !== null && String(row.pillar).trim() !== '') {
            const tmp = parseInt(String(row.pillar).trim());
            if (!isNaN(tmp)) pillarIdx = tmp;
          }
          data.projects.push(createProject(fields, pillarIdx));
        }
        return;
      }

      // Title row
      if (label === 'title') {
        data.title = fields.belief;
        return;
      }

      // Mode row
      if (label === 'mode') {
        data.mode = fields.belief.toLowerCase() === 'personal' ? 'personal' : 'business';
        return;
      }
      
      // Insight rows
      if (label.startsWith('insight_')) {
        const insightKey = label;
        if (data.hasOwnProperty(insightKey)) {
          data[insightKey] = fields.belief;
        }
        return;
      }

      // Pillar name rows
      if (label.startsWith('pillar_name:')) {
        const idx = parseInt(label.split(':')[1]);
        if (idx >= 1 && idx <= 3) {
          data.pillarNames[idx] = fields.belief;
        }
        return;
      }

      // Core belief
      if (label === 'core') {
        data.core = { label: 'Core' };
        applyNodeData(data.core, fields);
        if (projectData.hasLegacy || projectData.hasNew) {
          data.projects.push(createProject(fields, null));
        }
        return;
      }

      // Pillar rows
      if (label.startsWith('pillar:')) {
        const idx = parseInt(label.split(':')[1]);
        if (!data.pillars[idx]) data.pillars[idx] = createEmptyNode();
        applyNodeData(data.pillars[idx], fields);
        if (projectData.hasLegacy || projectData.hasNew) {
          data.projects.push(createProject(fields, idx));
        }
        return;
      }

      // Sub rows
      if (label.startsWith('sub:')) {
        const parts = label.split(':');
        const p = parseInt(parts[1]);
        const s = parseInt(parts[2]);
        if (!data.subs[p]) data.subs[p] = {};
        if (!data.subs[p][s]) data.subs[p][s] = createEmptyNode();
        applyNodeData(data.subs[p][s], fields);
        if (projectData.hasLegacy || projectData.hasNew) {
          data.projects.push(createProject(fields, p));
        }
        return;
      }

      // Micro rows
      if (label.startsWith('micro:')) {
        const parts = label.split(':');
        const p = parseInt(parts[1]);
        const s = parseInt(parts[2]);
        const m = parseInt(parts[3]);
        if (!data.micros[p]) data.micros[p] = {};
        if (!data.micros[p][s]) data.micros[p][s] = {};
        if (!data.micros[p][s][m]) data.micros[p][s][m] = createEmptyNode();
        applyNodeData(data.micros[p][s][m], fields);
        if (projectData.hasLegacy || projectData.hasNew) {
          data.projects.push(createProject(fields, p));
        }
        return;
      }

      // Lens rows
      if (label.startsWith('lens')) {
        if (fields.belief) {
          let pillarsList = [];
          if (row.pillars !== undefined && row.pillars !== '') {
            const raw = String(row.pillars).trim();
            raw.split(/[;,]/).forEach(part => {
              const val = parseInt(part.trim());
              if (!isNaN(val) && val >= 1 && val <= 3) {
                pillarsList.push(val);
              }
            });
          }
          const lensObj = createEmptyNode();
          applyNodeData(lensObj, fields);
          lensObj.pillars = pillarsList;
          lensObj.lensIndex = data.lenses.length;
          data.lenses.push(lensObj);
        }
        return;
      }
    });

    // Fill in defaults for missing structure
    const defaultNames = data.mode === 'personal'
      ? ['Outer Self', 'Inner Self', 'Relationships']
      : ['Team', 'Finance', 'Customer'];

    for (let i = 1; i <= 3; i++) {
      if (!data.pillars[i]) data.pillars[i] = createEmptyNode();
      if (!data.pillarNames[i]) data.pillarNames[i] = defaultNames[i - 1];
      if (!data.subs[i]) data.subs[i] = {};
      if (!data.micros[i]) data.micros[i] = {};
      
      for (let j = 1; j <= 3; j++) {
        if (!data.subs[i][j]) data.subs[i][j] = createEmptyNode();
        if (!data.micros[i][j]) data.micros[i][j] = {};
        
        for (let k = 1; k <= 3; k++) {
          if (!data.micros[i][j][k]) data.micros[i][j][k] = createEmptyNode();
        }
      }
    }

    return data;
  }

  // Public API
  return {
    parseCSV,
    parsePole,
    parseSplitPole,
    createEmptyNode
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIMDataParser;
}
