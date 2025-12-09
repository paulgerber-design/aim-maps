/**
 * AIM Viewer Chart Renderer
 * Handles all D3-based sunburst chart visualization
 * v2.0.0 - Phase 5a: Incomplete indicators, updated pole names
 */

const AIMChartRenderer = (function() {
  'use strict';

  // ==========================================================================
  // Private State
  // ==========================================================================

  /** Cached ring radii for current state */
  let currentRingRadii = null;

  /** D3 selections */
  let svg = null;
  let tooltip = null;
  let legendContainer = null;
  
  /** Callback for incomplete wedge clicks */
  let onIncompleteClick = null;

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the chart renderer with DOM references
   * @param {Object} refs - Object containing svg, tooltip, legendContainer selections
   */
  function init(refs) {
    svg = refs.svg;
    tooltip = refs.tooltip;
    legendContainer = refs.legendContainer;
    onIncompleteClick = refs.onIncompleteClick || null;
    
    // Add SVG pattern for incomplete segments
    addIncompletePattern();
  }
  
  /**
   * Add SVG pattern definition for incomplete segments
   */
  function addIncompletePattern() {
    if (!svg) return;
    
    // Check if defs already exists
    let defs = svg.select('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
    }
    
    // Add diagonal stripe pattern
    const pattern = defs.append('pattern')
      .attr('id', 'incompletePattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8);
    
    pattern.append('rect')
      .attr('width', 8)
      .attr('height', 8)
      .attr('fill', AIM_CONFIG.incompleteColor || '#e8e8e8');
    
    pattern.append('path')
      .attr('d', 'M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2')
      .attr('stroke', '#d0d0d0')
      .attr('stroke-width', 1);
  }

  // ==========================================================================
  // Color Computation
  // ==========================================================================

  /**
   * Compute fill color for a descriptor based on heatmap settings
   * @param {Object} descriptor - Arc descriptor
   * @returns {string} - Fill color
   */
  function computeFillColor(descriptor) {
    const pillarColors = AIM_CONFIG.pillarColors;
    const depthAlpha = AIM_CONFIG.depthAlpha;
    const heatmapType = AIMState.getHeatmapType();
    
    // Parse pillar base color
    const baseHex = pillarColors[descriptor.pillar - 1];
    const base = hexToRgb(baseHex);
    
    // For incomplete segments, use a much lighter alpha to indicate "placeholder"
    // but still show the pillar color
    let alpha = depthAlpha[descriptor.depth];
    if (descriptor.incomplete) {
      alpha = alpha * 0.4; // Make incomplete segments more transparent
    }

    if (heatmapType === 'off') {
      return `rgba(${base.r},${base.g},${base.b},${alpha})`;
    }

    // Get the value for heatmap - support both old and new pole names
    let val = 50;
    if (heatmapType === 'confidence') {
      val = descriptor.confidence || 50;
    } else if (heatmapType === 'adapting' || heatmapType === 'ac') {
      const v = descriptor.pole_ac_value;
      val = v !== null && v !== undefined ? ((v + 3) / 6) * 100 : 50;
    } else if (heatmapType === 'celebrating' || heatmapType === 'ce') {
      const v = descriptor.pole_ce_value;
      val = v !== null && v !== undefined ? ((v + 3) / 6) * 100 : 50;
    } else if (heatmapType === 'connecting' || heatmapType === 'cx') {
      const v = descriptor.pole_cx_value;
      val = v !== null && v !== undefined ? ((v + 3) / 6) * 100 : 50;
    }

    const heat = computeHeatColor(val);
    // Blend heat with base color
    return blendColors(base, heat, alpha, AIM_CONFIG.heatBlendRatio);
  }

  /**
   * Convert hex color to RGB object
   * @param {string} hex - Hex color string
   * @returns {Object} - {r, g, b}
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 136, g: 198, b: 203 };
  }

  /**
   * Compute heatmap color for a value
   * @param {number} val - Value (0-100)
   * @returns {Object} - {r, g, b}
   */
  function computeHeatColor(val) {
    const ratio = Math.max(0, Math.min(100, val)) / 100;
    const hue = 120 * ratio;
    const hslColor = d3.hsl(hue, 0.65, 0.45);
    const rgb = hslColor.rgb();
    return { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b) };
  }

  /**
   * Blend two colors
   * @param {Object} base - Base RGB color
   * @param {Object} heat - Heat RGB color
   * @param {number} alpha - Alpha value
   * @param {number} blendRatio - How much heat to blend in
   * @returns {string} - RGBA color string
   */
  function blendColors(base, heat, alpha, blendRatio) {
    const r = Math.round(base.r * (1 - blendRatio) + heat.r * blendRatio);
    const g = Math.round(base.g * (1 - blendRatio) + heat.g * blendRatio);
    const b = Math.round(base.b * (1 - blendRatio) + heat.b * blendRatio);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ==========================================================================
  // Radii Computation
  // ==========================================================================

  /**
   * Compute radii for all view states based on current SVG size
   * @returns {Object} - Radii for states A, B, C
   */
  function computeRadii() {
    const chartWrapper = svg.node().parentNode;
    const containerEl = document.getElementById('container');
    const sidebarEl = document.getElementById('sidebar');
    const titleBarEl = document.getElementById('titleBar');

    const parentRect = chartWrapper.getBoundingClientRect();
    let containerWidth = containerEl ? containerEl.getBoundingClientRect().width : 0;
    let sidebarWidth = sidebarEl ? sidebarEl.getBoundingClientRect().width : 0;
    
    let availableWidth = parentRect.width > 0 
      ? parentRect.width 
      : Math.max(containerWidth - sidebarWidth - 32, 300);
    
    const headerHeight = titleBarEl ? titleBarEl.getBoundingClientRect().height : 0;
    let availableHeight = Math.max(window.innerHeight - headerHeight - 40, 300);
    
    const size = Math.min(availableWidth, availableHeight);
    
    svg.attr('width', size).attr('height', size);
    chartWrapper.style.height = size + 'px';
    
    const margin = 4;
    const radius = (size / 2) - margin;
    
    // Ring ratios for each state
    const globalRatios = [0.50, 0.35, 0.10, 0.05];  // [core, pillar, sub, micro]
    const bRatios = [0.55, 0.35, 0.10];              // [center, sub, micro]
    const cRatios = [0.60, 0.40];                    // [center, micro]
    
    const gap = 2;

    // Global state radii
    const rA1 = radius * globalRatios[0];
    const rA2 = rA1 + radius * globalRatios[1];
    const rA3 = rA2 + radius * globalRatios[2];
    const globalRadii = {
      coreEnd: rA1 - gap,
      pillarStart: rA1,
      pillarEnd: rA2 - gap,
      subStart: rA2,
      subEnd: rA3 - gap,
      microStart: rA3,
      microEnd: radius
    };

    // Pillar focus radii
    const bR1 = radius * bRatios[0];
    const bR2 = bR1 + radius * bRatios[1];
    const pillarRadii = {
      center: bR1 - gap,
      subStart: bR1,
      subEnd: bR2 - gap,
      microStart: bR2,
      microEnd: radius
    };

    // Sub focus radii
    const cR1 = radius * cRatios[0];
    const subRadii = {
      center: cR1 - gap,
      microStart: cR1,
      microEnd: radius
    };

    return { A: globalRadii, B: pillarRadii, C: subRadii };
  }

  // ==========================================================================
  // Arc Descriptors
  // ==========================================================================

  /**
   * Compute arc descriptors for the current view state
   * @returns {Array} - Array of arc descriptor objects
   */
  function computeArcDescriptors() {
    const descriptors = [];
    const twoPi = Math.PI * 2;
    const aimData = AIMState.getData();
    const currentState = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    const selectedSub = AIMState.getSelectedSub();
    const maxCharsByDepth = AIM_CONFIG.maxCharsByDepth;

    if (!aimData) return descriptors;

    currentRingRadii = computeRadii();
    const radii = currentRingRadii[currentState];

    if (currentState === 'A') {
      // Global view: all pillars, subs, micros
      const majorStep = twoPi / 3;
      const subStep = majorStep / 3;
      const microStep = subStep / 3;

      for (let p = 1; p <= 3; p++) {
        const start = (p - 1) * majorStep;
        const end = p * majorStep;
        const pillarData = aimData.pillars[p];
        const isIncomplete = !AIMUtils.isNodeComplete(pillarData);
        
        // For incomplete pillars, show the pillar name; for complete, show belief
        const pillarName = aimData.pillarNames[p] || `Pillar ${p}`;
        const beliefTitle = pillarData.title || pillarData.belief;
        const displayTitle = isIncomplete ? pillarName : (beliefTitle || pillarName);
        const label = AIMUtils.truncateText(displayTitle, maxCharsByDepth[1]);

        descriptors.push({
          depth: 1,
          pillar: p,
          sub: null,
          micro: null,
          startAngle: start,
          endAngle: end,
          innerRadius: radii.pillarStart,
          outerRadius: radii.pillarEnd,
          belief: pillarData.belief,
          label: label,
          pillarName: pillarName, // Store for modal display
          confidence: pillarData.confidence || 50,
          showLabel: true, // Always show pillar names
          incomplete: isIncomplete,
          pole_ac_value: pillarData.pole_ac_value,
          pole_ac_letter: pillarData.pole_ac_letter,
          pole_ce_value: pillarData.pole_ce_value,
          pole_ce_letter: pillarData.pole_ce_letter,
          pole_cx_value: pillarData.pole_cx_value,
          pole_cx_letter: pillarData.pole_cx_letter
        });

        // Subs
        for (let s = 1; s <= 3; s++) {
          const sStart = start + (s - 1) * subStep;
          const sEnd = sStart + subStep;
          const subData = aimData.subs[p][s];
          const subTitle = subData.title || subData.belief;
          const subLabel = AIMUtils.truncateText(subTitle, maxCharsByDepth[2]);
          const subIncomplete = !AIMUtils.isNodeComplete(subData);

          descriptors.push({
            depth: 2,
            pillar: p,
            sub: s,
            micro: null,
            startAngle: sStart,
            endAngle: sEnd,
            innerRadius: radii.subStart,
            outerRadius: radii.subEnd,
            belief: subData.belief,
            label: subLabel,
            confidence: subData.confidence || 50,
            showLabel: false,
            incomplete: subIncomplete,
            pole_ac_value: subData.pole_ac_value,
            pole_ac_letter: subData.pole_ac_letter,
            pole_ce_value: subData.pole_ce_value,
            pole_ce_letter: subData.pole_ce_letter,
            pole_cx_value: subData.pole_cx_value,
            pole_cx_letter: subData.pole_cx_letter
          });

          // Micros
          for (let m = 1; m <= 3; m++) {
            const mStart = sStart + (m - 1) * microStep;
            const mEnd = mStart + microStep;
            const microData = aimData.micros[p][s][m];
            const microTitle = microData.title || microData.belief;
            const microLabel = AIMUtils.truncateText(microTitle, maxCharsByDepth[3]);
            const microIncomplete = !AIMUtils.isNodeComplete(microData);

            descriptors.push({
              depth: 3,
              pillar: p,
              sub: s,
              micro: m,
              startAngle: mStart,
              endAngle: mEnd,
              innerRadius: radii.microStart,
              outerRadius: radii.microEnd,
              belief: microData.belief,
              label: microLabel,
              confidence: microData.confidence || 50,
              showLabel: false,
              incomplete: microIncomplete,
              pole_ac_value: microData.pole_ac_value,
              pole_ac_letter: microData.pole_ac_letter,
              pole_ce_value: microData.pole_ce_value,
              pole_ce_letter: microData.pole_ce_letter,
              pole_cx_value: microData.pole_cx_value,
              pole_cx_letter: microData.pole_cx_letter
            });
          }
        }
      }
    } else if (currentState === 'B' && selectedPillar) {
      // Pillar focus view
      const p = selectedPillar;
      const subStep = twoPi / 3;
      const microStep = twoPi / 9;

      for (let s = 1; s <= 3; s++) {
        const sStart = (s - 1) * subStep;
        const sEnd = sStart + subStep;
        const subData = aimData.subs[p][s];
        const subTitle = subData.title || subData.belief;
        const subLabel = AIMUtils.truncateText(subTitle, maxCharsByDepth[2]);
        const subIncomplete = !AIMUtils.isNodeComplete(subData);

        descriptors.push({
          depth: 2,
          pillar: p,
          sub: s,
          micro: null,
          startAngle: sStart,
          endAngle: sEnd,
          innerRadius: radii.subStart,
          outerRadius: radii.subEnd,
          belief: subData.belief,
          label: subLabel,
          confidence: subData.confidence || 50,
          showLabel: !subIncomplete,
          incomplete: subIncomplete,
          pole_ac_value: subData.pole_ac_value,
          pole_ac_letter: subData.pole_ac_letter,
          pole_ce_value: subData.pole_ce_value,
          pole_ce_letter: subData.pole_ce_letter,
          pole_cx_value: subData.pole_cx_value,
          pole_cx_letter: subData.pole_cx_letter
        });

        // Micros for this sub
        for (let m = 1; m <= 3; m++) {
          const microIdx = (s - 1) * 3 + (m - 1);
          const mStart = microIdx * microStep;
          const mEnd = mStart + microStep;
          const microData = aimData.micros[p][s][m];
          const microTitle = microData.title || microData.belief;
          const microLabel = AIMUtils.truncateText(microTitle, maxCharsByDepth[3]);
          const microIncomplete = !AIMUtils.isNodeComplete(microData);

          descriptors.push({
            depth: 3,
            pillar: p,
            sub: s,
            micro: m,
            startAngle: mStart,
            endAngle: mEnd,
            innerRadius: radii.microStart,
            outerRadius: radii.microEnd,
            belief: microData.belief,
            label: microLabel,
            confidence: microData.confidence || 50,
            showLabel: false,
            pole_ac_value: microData.pole_ac_value,
            pole_ac_letter: microData.pole_ac_letter,
            pole_ce_value: microData.pole_ce_value,
            pole_ce_letter: microData.pole_ce_letter,
            pole_cx_value: microData.pole_cx_value,
            pole_cx_letter: microData.pole_cx_letter
          });
        }
      }
    } else if (currentState === 'C' && selectedPillar && selectedSub) {
      // Sub focus view
      const p = selectedPillar;
      const s = selectedSub;
      const microStep = twoPi / 3;

      for (let m = 1; m <= 3; m++) {
        const mStart = (m - 1) * microStep;
        const mEnd = mStart + microStep;
        const microData = aimData.micros[p][s][m];
        const microTitle = microData.title || microData.belief;
        const microLabel = AIMUtils.truncateText(microTitle, maxCharsByDepth[3]);

        descriptors.push({
          depth: 3,
          pillar: p,
          sub: s,
          micro: m,
          startAngle: mStart,
          endAngle: mEnd,
          innerRadius: radii.microStart,
          outerRadius: radii.microEnd,
          belief: microData.belief,
          label: microLabel,
          confidence: microData.confidence || 50,
          showLabel: true,
          pole_ac_value: microData.pole_ac_value,
          pole_ac_letter: microData.pole_ac_letter,
          pole_ce_value: microData.pole_ce_value,
          pole_ce_letter: microData.pole_ce_letter,
          pole_cx_value: microData.pole_cx_value,
          pole_cx_letter: microData.pole_cx_letter
        });
      }
    }

    return descriptors;
  }

  // ==========================================================================
  // Main Chart Update
  // ==========================================================================

  /**
   * Update the chart with current state
   */
  function updateChart() {
    const aimData = AIMState.getData();
    if (!aimData || !svg) return;

    const currentState = AIMState.getState();
    const descriptors = computeArcDescriptors();

    // Clear and recreate
    svg.selectAll('*').remove();
    const g = svg.append('g')
      .attr('class', 'arcs')
      .attr('transform', () => {
        const bbox = svg.node().getBoundingClientRect();
        return `translate(${bbox.width / 2},${bbox.height / 2})`;
      });

    // Draw arcs
    g.selectAll('path.wedge')
      .data(descriptors, d => `${d.depth}-${d.pillar}-${d.sub || 0}-${d.micro || 0}-${d.startAngle}`)
      .join('path')
      .attr('class', 'wedge')
      .attr('d', d => d3.arc()({
        innerRadius: d.innerRadius,
        outerRadius: d.outerRadius,
        startAngle: d.startAngle,
        endAngle: d.endAngle
      }))
      .attr('fill', d => computeFillColor(d))
      .attr('stroke', 'none')
      .attr('tabindex', d => {
        if (currentState === 'A' && (d.depth === 1 || d.depth === 2)) return 0;
        if (currentState === 'B' && d.depth === 2) return 0;
        return -1;
      })
      .style('cursor', d => {
        if (currentState === 'A' && (d.depth === 1 || d.depth === 2)) return 'pointer';
        if (currentState === 'B' && d.depth === 2) return 'pointer';
        return 'default';
      })
      .on('mouseover', function(event, d) {
        showTooltip(event, d);
        highlightLegendChip(d.pillar);
      })
      .on('mousemove', function(event) {
        moveTooltip(event);
      })
      .on('mouseout', function() {
        hideTooltip();
        removeLegendHighlight();
      })
      .on('click', function(event, d) {
        event.preventDefault();
        handleArcClick(d);
      });

    // Draw separators, center text, labels
    drawSeparators(g);
    drawCenterText(g);
    drawArcLabels(g, descriptors);
    addCenterHover(g);
  }

  // ==========================================================================
  // Separators
  // ==========================================================================

  /**
   * Draw separator lines between wedges
   * @param {Object} g - D3 selection of arc group
   */
  function drawSeparators(g) {
    const currentState = AIMState.getState();
    const radii = currentRingRadii[currentState];
    const twoPi = Math.PI * 2;

    const polarToCartesian = (angle, radius) => {
      const x = Math.cos(angle - Math.PI / 2) * radius;
      const y = Math.sin(angle - Math.PI / 2) * radius;
      return [x, y];
    };

    if (currentState === 'A') {
      // Major separators (pillars)
      const majorAngles = [0, twoPi / 3, 2 * twoPi / 3];
      majorAngles.forEach(angle => {
        const [x0, y0] = polarToCartesian(angle, radii.pillarStart);
        const [x1, y1] = polarToCartesian(angle, radii.microEnd);
        g.append('line')
          .attr('x1', x0).attr('y1', y0)
          .attr('x2', x1).attr('y2', y1)
          .attr('stroke', 'rgba(0,0,0,0.30)')
          .attr('stroke-width', 1.6);
      });

      // Minor separators (subs)
      const subStep = twoPi / 9;
      for (let i = 0; i < 9; i++) {
        if (i % 3 === 0) continue; // Skip major angles
        const angle = i * subStep;
        const [x0, y0] = polarToCartesian(angle, radii.subStart);
        const [x1, y1] = polarToCartesian(angle, radii.microEnd);
        g.append('line')
          .attr('x1', x0).attr('y1', y0)
          .attr('x2', x1).attr('y2', y1)
          .attr('stroke', 'rgba(0,0,0,0.22)')
          .attr('stroke-width', 1.2);
      }

      // Micro separators
      const microStep = twoPi / 27;
      for (let i = 0; i < 27; i++) {
        if (i % 3 === 0) continue; // Skip sub angles
        const angle = i * microStep;
        const [x0, y0] = polarToCartesian(angle, radii.microStart);
        const [x1, y1] = polarToCartesian(angle, radii.microEnd);
        g.append('line')
          .attr('x1', x0).attr('y1', y0)
          .attr('x2', x1).attr('y2', y1)
          .attr('stroke', 'rgba(0,0,0,0.18)')
          .attr('stroke-width', 1.0);
      }
    } else if (currentState === 'B') {
      // Sub separators
      const subStep = twoPi / 3;
      [0, subStep, subStep * 2].forEach(angle => {
        const [x0, y0] = polarToCartesian(angle, radii.subStart);
        const [x1, y1] = polarToCartesian(angle, radii.microEnd);
        g.append('line')
          .attr('x1', x0).attr('y1', y0)
          .attr('x2', x1).attr('y2', y1)
          .attr('stroke', 'rgba(0,0,0,0.22)')
          .attr('stroke-width', 1.2);
      });

      // Micro separators
      const microStep = twoPi / 9;
      for (let k = 0; k < 9; k++) {
        const angle = microStep * k;
        const [x0, y0] = polarToCartesian(angle, radii.microStart);
        const [x1, y1] = polarToCartesian(angle, radii.microEnd);
        g.append('line')
          .attr('x1', x0).attr('y1', y0)
          .attr('x2', x1).attr('y2', y1)
          .attr('stroke', 'rgba(0,0,0,0.18)')
          .attr('stroke-width', 1.0);
      }
    } else if (currentState === 'C') {
      const microStep = twoPi / 3;
      [0, microStep, microStep * 2].forEach(angle => {
        const [x0, y0] = polarToCartesian(angle, radii.microStart);
        const [x1, y1] = polarToCartesian(angle, radii.microEnd);
        g.append('line')
          .attr('x1', x0).attr('y1', y0)
          .attr('x2', x1).attr('y2', y1)
          .attr('stroke', 'rgba(0,0,0,0.18)')
          .attr('stroke-width', 1.0);
      });
    }
  }

  // ==========================================================================
  // Center Text
  // ==========================================================================

  /**
   * Draw center text based on current state
   * @param {Object} g - D3 selection of arc group
   */
  function drawCenterText(g) {
    const aimData = AIMState.getData();
    const currentState = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    const selectedSub = AIMState.getSelectedSub();
    const centerBeliefMaxChars = AIM_CONFIG.centerBeliefMaxChars;
    const centerLineGap = AIM_CONFIG.centerLineGap;

    if (!aimData) return;

    const textGroup = g.append('g').attr('pointer-events', 'none');
    let lines = [];
    let radius = 0;

    if (currentState === 'A') {
      radius = currentRingRadii.A.coreEnd;
      const coreBelief = aimData.core.belief || '';
      const truncated = AIMUtils.truncateText(coreBelief, centerBeliefMaxChars);
      const wrapLen = Math.max(8, Math.floor(radius / 8));
      const beliefLines = AIMUtils.wrapLines(truncated, wrapLen);
      lines = ['Core', ...beliefLines];
    } else if (currentState === 'B' && selectedPillar) {
      radius = currentRingRadii.B.center;
      const pillarLabel = aimData.pillarNames[selectedPillar] || '';
      const pillarBelief = aimData.pillars[selectedPillar].belief || '';
      const truncated = AIMUtils.truncateText(pillarBelief, centerBeliefMaxChars);
      const wrapLen = Math.max(8, Math.floor(radius / 8));
      const beliefLines = AIMUtils.wrapLines(truncated, wrapLen);
      lines = [pillarLabel, ...beliefLines];
    } else if (currentState === 'C' && selectedPillar && selectedSub) {
      radius = currentRingRadii.C.center;
      const subTitle = aimData.subs[selectedPillar][selectedSub].title || '';
      const subBelief = aimData.subs[selectedPillar][selectedSub].belief || '';
      const truncated = AIMUtils.truncateText(subBelief, centerBeliefMaxChars);
      const wrapLen = Math.max(8, Math.floor(radius / 8));
      const beliefLines = AIMUtils.wrapLines(truncated, wrapLen);
      if (subTitle) lines.push(subTitle);
      lines.push(...beliefLines);
    }

    if (lines.length === 0) return;

    const fontSize = Math.min(radius / (lines.length + 1), 18);
    const textEl = textGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', fontSize + 'px')
      .style('fill', '#111');

    lines.forEach((line, i) => {
      textEl.append('tspan')
        .attr('x', 0)
        .attr('dy', i === 0 ? -(lines.length - 1) / 2 * (fontSize + centerLineGap) : (fontSize + centerLineGap))
        .style('font-weight', i === 0 ? '700' : '400')
        .text(line);
    });
  }

  // ==========================================================================
  // Arc Labels
  // ==========================================================================

  /**
   * Draw labels inside wedges marked with showLabel
   * @param {Object} g - D3 selection
   * @param {Array} descriptors - Arc descriptors
   */
  function drawArcLabels(g, descriptors) {
    const labelDescs = descriptors.filter(d => d.showLabel);

    labelDescs.forEach(d => {
      const arcGen = d3.arc();
      const centroid = arcGen.centroid(d);
      const thickness = d.outerRadius - d.innerRadius;
      const fontSize = Math.min(thickness / 3, 16);
      const arcLength = (d.endAngle - d.startAngle) * ((d.innerRadius + d.outerRadius) / 2);
      const charLimit = Math.max(8, Math.min(16, Math.floor(arcLength / 8)));
      const baseText = d.label && d.label.trim().length > 0 ? d.label : d.belief;
      const lines = AIMUtils.wrapLines(baseText, charLimit);
      const lineHeight = fontSize + 2;

      const text = g.append('text')
        .attr('transform', `translate(${centroid[0]},${centroid[1]})`)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('pointer-events', 'none')
        .style('fill', '#111')
        .style('font-size', fontSize + 'px');

      lines.forEach((line, i) => {
        text.append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? -(lines.length - 1) / 2 * lineHeight : lineHeight)
          .text(line);
      });
    });
  }

  // ==========================================================================
  // Center Hover
  // ==========================================================================

  /**
   * Add invisible circle for center hover tooltip
   * @param {Object} g - D3 selection
   */
  function addCenterHover(g) {
    const aimData = AIMState.getData();
    const currentState = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    const selectedSub = AIMState.getSelectedSub();

    if (!aimData) return;

    let radius = 0;
    if (currentState === 'A') {
      radius = currentRingRadii.A.coreEnd;
    } else if (currentState === 'B') {
      radius = currentRingRadii.B.center;
    } else if (currentState === 'C') {
      radius = currentRingRadii.C.center;
    }

    if (radius <= 0) return;

    function getCenterDescriptor() {
      if (currentState === 'A') {
        return { belief: aimData.core.belief || '', pillar: null, sub: null, micro: null };
      } else if (currentState === 'B' && selectedPillar) {
        return { belief: aimData.pillars[selectedPillar].belief || '', pillar: selectedPillar, sub: null, micro: null };
      } else if (currentState === 'C' && selectedPillar && selectedSub) {
        return { belief: aimData.subs[selectedPillar][selectedSub].belief || '', pillar: selectedPillar, sub: selectedSub, micro: null };
      }
      return { belief: '', pillar: null, sub: null, micro: null };
    }

    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .on('mouseover', function(event) {
        const desc = getCenterDescriptor();
        showTooltip(event, desc);
      })
      .on('mousemove', moveTooltip)
      .on('mouseout', hideTooltip);
  }

  // ==========================================================================
  // Click Handling
  // ==========================================================================

  /**
   * Handle clicks on wedges
   * @param {Object} d - Clicked descriptor
   */
  function handleArcClick(d) {
    const currentState = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    const aimData = AIMState.getData();

    // If clicking on an incomplete segment, trigger the incomplete callback
    if (d.incomplete && onIncompleteClick) {
      const pillarName = aimData ? (aimData.pillarNames[d.pillar] || `Pillar ${d.pillar}`) : `Pillar ${d.pillar}`;
      onIncompleteClick({
        pillar: d.pillar,
        pillarName: pillarName,
        sub: d.sub,
        micro: d.micro,
        depth: d.depth
      });
      return;
    }

    if (currentState === 'A') {
      if (d.depth === 1) {
        AIMState.navigateToPillar(d.pillar);
        setTimeout(() => flashRing(currentRingRadii.B.subStart, currentRingRadii.B.subEnd), 0);
      } else if (d.depth === 2) {
        AIMState.navigateToPillar(d.pillar);
        AIMState.setPreselectedSub(d.sub);
        setTimeout(() => flashRing(currentRingRadii.B.subStart, currentRingRadii.B.subEnd), 0);
      }
    } else if (currentState === 'B' && d.pillar === selectedPillar) {
      if (d.depth === 2) {
        AIMState.navigateToSub(d.pillar, d.sub);
        setTimeout(() => flashRing(currentRingRadii.C.microStart, currentRingRadii.C.microEnd), 0);
      }
    }
  }

  // ==========================================================================
  // Tooltip
  // ==========================================================================

  /**
   * Show tooltip with belief information
   * @param {Event} event - Mouse event
   * @param {Object} d - Descriptor
   */
  function showTooltip(event, d) {
    const aimData = AIMState.getData();
    if (!d || !aimData || !tooltip) return;

    tooltip.style('display', 'block');
    let html = '';

    // Get current belief info
    let currentLabel = 'Core';
    let currentText = aimData.core.belief || '';
    let parentLabel = '';
    let parentText = '';
    let curObj = aimData.core;

    if (d.micro) {
      currentLabel = 'Micro';
      curObj = aimData.micros[d.pillar][d.sub][d.micro];
      currentText = curObj.belief || '';
      parentLabel = 'Sub';
      parentText = aimData.subs[d.pillar][d.sub].belief || '';
    } else if (d.sub) {
      currentLabel = 'Sub';
      curObj = aimData.subs[d.pillar][d.sub];
      currentText = curObj.belief || '';
      parentLabel = 'Pillar';
      parentText = aimData.pillars[d.pillar].belief || '';
    } else if (d.pillar) {
      currentLabel = 'Pillar';
      curObj = aimData.pillars[d.pillar];
      currentText = curObj.belief || '';
      parentLabel = 'Core';
      parentText = aimData.core.belief || '';
    }

    html += `<div style="font-size:18px; font-weight:700; margin-bottom:4px;">`;
    html += `<strong>${currentLabel}:</strong> ${currentText}</div>`;
    
    if (parentText) {
      html += `<div style="font-size:14px; color:#555;">↳ <strong>${parentLabel}:</strong> ${parentText}</div>`;
    }

    // Metadata
    const conf = curObj.confidence;
    const alignLabel = conf !== null ? AIMUtils.getAlignmentLabel(conf) : '';
    const acPhrase = AIMUtils.getPolePhrase(curObj.pole_ac_value, curObj.pole_ac_letter, 'ac');
    const cePhrase = AIMUtils.getPolePhrase(curObj.pole_ce_value, curObj.pole_ce_letter, 'ce');
    const cxPhrase = AIMUtils.getPolePhrase(curObj.pole_cx_value, curObj.pole_cx_letter, 'cx');
    const upd = curObj.updated ? AIMUtils.formatDateString(curObj.updated) : '';

    html += `<div style="border-top:1px solid #e0e0e0; padding-top:4px; margin-top:6px; font-size:11.5px; color:#555;">
      <table style="border-collapse:collapse; width:100%;">
        ${conf !== null ? `<tr><td>Alignment:</td><td style="text-align:right;">${alignLabel} (${conf}%)</td></tr>` : ''}
        ${acPhrase ? `<tr><td>Adaptive:</td><td style="text-align:right;">${acPhrase}</td></tr>` : ''}
        ${cePhrase ? `<tr><td>Celebration:</td><td style="text-align:right;">${cePhrase}</td></tr>` : ''}
        ${cxPhrase ? `<tr><td>Collective:</td><td style="text-align:right;">${cxPhrase}</td></tr>` : ''}
        ${upd ? `<tr><td>Updated:</td><td style="text-align:right;">${upd}</td></tr>` : ''}
      </table>
    </div>`;

    tooltip.html(html);
    moveTooltip(event);
  }

  /**
   * Move tooltip to follow cursor
   * @param {Event} event - Mouse event
   */
  function moveTooltip(event) {
    if (!tooltip) return;
    const tooltipNode = tooltip.node();
    const padding = 12;
    const tooltipRect = tooltipNode.getBoundingClientRect();
    let x = event.clientX + 14;
    let y = event.clientY + 14;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    if (x + tooltipRect.width + padding > viewportWidth) {
      x = viewportWidth - tooltipRect.width - padding;
    }
    if (y + tooltipRect.height + padding > viewportHeight) {
      y = viewportHeight - tooltipRect.height - padding;
    }

    tooltip.style('left', x + 'px').style('top', y + 'px');
  }

  /**
   * Hide tooltip
   */
  function hideTooltip() {
    if (tooltip) tooltip.style('display', 'none');
  }

  // ==========================================================================
  // Legend Highlight
  // ==========================================================================

  /**
   * Highlight legend chip for pillar
   * @param {number} pillarIdx - Pillar index
   */
  function highlightLegendChip(pillarIdx) {
    if (!legendContainer) return;
    const pillarColors = AIM_CONFIG.pillarColors;
    
    legendContainer.selectAll('.legend-chip').each(function(d, i) {
      const chip = d3.select(this);
      if (i + 1 === pillarIdx) {
        chip.select('.dot').style('outline', `2px solid ${pillarColors[pillarIdx - 1]}`);
      }
    });
  }

  /**
   * Remove legend highlight
   */
  function removeLegendHighlight() {
    if (legendContainer) {
      legendContainer.selectAll('.legend-chip .dot').style('outline', 'none');
    }
  }

  // ==========================================================================
  // Flash Effect
  // ==========================================================================

  /**
   * Flash a ring to confirm navigation
   * @param {number} innerR - Inner radius
   * @param {number} outerR - Outer radius
   */
  function flashRing(innerR, outerR) {
    if (!svg) return;
    const g = svg.select('g.arcs');
    if (g.empty()) return;

    const path = d3.arc()({
      innerRadius: innerR,
      outerRadius: outerR,
      startAngle: 0,
      endAngle: Math.PI * 2
    });

    g.append('path')
      .attr('d', path)
      .attr('fill', 'rgba(255,255,255,0.3)')
      .attr('pointer-events', 'none')
      .transition()
      .duration(150)
      .attr('fill', 'rgba(255,255,255,0)')
      .remove();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    init,
    updateChart,
    computeRadii,
    flashRing,
    highlightLegendChip,
    removeLegendHighlight
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIMChartRenderer;
}
