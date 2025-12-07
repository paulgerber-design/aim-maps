/**
 * AIM Viewer Application
 * Main entry point that coordinates all modules
 * v1.0.0
 */

const AIMApp = (function() {
  'use strict';

  // ==========================================================================
  // DOM References
  // ==========================================================================

  let elements = {};

  function cacheElements() {
    elements = {
      // Main containers
      svg: d3.select('#aimChart'),
      tooltip: d3.select('#tooltip'),
      legendContainer: d3.select('#legend'),
      titleBar: d3.select('#titleBar'),
      titleText: document.getElementById('titleText'),
      breadcrumb: document.getElementById('breadcrumb'),
      
      // Inputs
      fileInput: document.getElementById('csvFileInput'),
      
      // Buttons
      resetBtn: document.getElementById('resetBtn'),
      uploadBtn: document.getElementById('uploadBtn'),
      saveBtn: document.getElementById('saveBtn'),
      viewTableBtn: document.getElementById('viewTableBtn'),
      
      // Tabs
      aimTab: document.getElementById('aimTab'),
      projectsTab: document.getElementById('projectsTab'),
      
      // Views
      aimView: document.getElementById('aimView'),
      projectsView: document.getElementById('projectsView'),
      projectsList: document.getElementById('projectsList'),
      
      // Heatmap controls
      heatmapSelect: document.getElementById('heatmapSelect'),
      heatmapInfo: document.getElementById('heatmapInfo'),
      heatmapLegend: document.getElementById('heatmapLegend'),
      
      // Lenses
      lensesList: document.getElementById('lensesList'),
      
      // Table overlay
      tableOverlay: document.getElementById('tableOverlay'),
      closeTableBtn: document.getElementById('closeTableBtn'),
      tableSearchInput: document.getElementById('tableSearch'),
      editTitleInput: document.getElementById('editTitleInput'),
      downloadCsvBtn: document.getElementById('downloadCsvBtn'),
      editDataBtn: document.getElementById('editDataBtn'),
      nodeTableBody: document.querySelector('#nodeTable tbody'),
      projectsTableBody: document.querySelector('#projectsTable tbody')
    };
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the application
   */
  async function init() {
    cacheElements();
    
    // Initialize chart renderer with DOM references
    AIMChartRenderer.init({
      svg: elements.svg,
      tooltip: elements.tooltip,
      legendContainer: elements.legendContainer
    });
    
    setupEventListeners();
    setupStateSubscription();
    
    // Try to load data from URL parameters
    await loadFromQuery();
    
    // If no data loaded, show empty state
    if (!AIMState.getData()) {
      showNoDataNotice();
    }
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // File upload
    if (elements.uploadBtn) {
      elements.uploadBtn.addEventListener('click', () => {
        elements.fileInput?.click();
      });
    }
    
    if (elements.fileInput) {
      elements.fileInput.addEventListener('change', handleFileUpload);
    }
    
    // Reset/Home button
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener('click', () => {
        AIMState.navigateToFullView();
        render();
      });
    }
    
    // Save button
    if (elements.saveBtn) {
      elements.saveBtn.addEventListener('click', downloadCSV);
    }
    
    // Tab switching
    if (elements.aimTab) {
      elements.aimTab.addEventListener('click', () => switchTab('aim'));
    }
    if (elements.projectsTab) {
      elements.projectsTab.addEventListener('click', () => switchTab('projects'));
    }
    
    // Heatmap select
    if (elements.heatmapSelect) {
      elements.heatmapSelect.addEventListener('change', (e) => {
        AIMState.setHeatmapType(e.target.value);
        updateChart();
        updateHeatmapInfo();
      });
    }
    
    // View data button
    if (elements.viewTableBtn) {
      elements.viewTableBtn.addEventListener('click', () => {
        elements.tableOverlay.style.display = 'flex';
        buildTableView();
      });
    }
    
    // Close table overlay
    if (elements.closeTableBtn) {
      elements.closeTableBtn.addEventListener('click', () => {
        elements.tableOverlay.style.display = 'none';
      });
    }
    
    // Download CSV
    if (elements.downloadCsvBtn) {
      elements.downloadCsvBtn.addEventListener('click', downloadCSV);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);
  }

  /**
   * Subscribe to state changes
   */
  function setupStateSubscription() {
    AIMState.subscribe((type, payload) => {
      switch (type) {
        case 'navigation':
        case 'state':
          render();
          updateBreadcrumb();
          break;
        case 'heatmap':
          updateChart();
          updateHeatmapInfo();
          break;
        case 'data':
          render();
          break;
      }
    });
  }

  // ==========================================================================
  // Data Loading
  // ==========================================================================

  /**
   * Load data from URL query parameters
   */
  async function loadFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      
      // Load from ?csv=filename.csv
      if (params.has('csv')) {
        const fileName = params.get('csv');
        if (fileName) {
          try {
            const response = await fetch(fileName);
            if (response.ok) {
              const text = await response.text();
              const rows = d3.csvParse(text);
              const data = AIMDataParser.parseCSV(rows);
              AIMState.setData(data);
              hideNoDataNotice();
              render();
              return;
            }
          } catch (err) {
            console.error('Error loading CSV:', err);
          }
        }
      }
      
      // Load from ?gist=GIST_ID
      if (params.has('gist')) {
        const gistParam = params.get('gist');
        if (gistParam) {
          try {
            const gistUrl = gistParam.startsWith('http') 
              ? gistParam 
              : `https://api.github.com/gists/${gistParam}`;
            
            const response = await fetch(gistUrl);
            if (response.ok) {
              let csvText;
              
              if (gistUrl.includes('api.github.com')) {
                const gistData = await response.json();
                const files = gistData.files;
                const fileNames = Object.keys(files);
                const targetFile = fileNames.find(name => name.endsWith('.csv')) || fileNames[0];
                
                if (targetFile && files[targetFile]) {
                  if (files[targetFile].content) {
                    csvText = files[targetFile].content;
                  } else if (files[targetFile].raw_url) {
                    const rawResponse = await fetch(files[targetFile].raw_url);
                    csvText = await rawResponse.text();
                  }
                }
              } else {
                csvText = await response.text();
              }
              
              if (csvText) {
                const rows = d3.csvParse(csvText);
                const data = AIMDataParser.parseCSV(rows);
                AIMState.setData(data);
                hideNoDataNotice();
                render();
                return;
              }
            }
          } catch (err) {
            console.error('Error loading Gist:', err);
          }
        }
      }
      
      // Load from ?data=BASE64
      if (params.has('data')) {
        const encoded = params.get('data');
        if (encoded) {
          try {
            const decoded = atob(decodeURIComponent(encoded));
            const rows = d3.csvParse(decoded);
            const data = AIMDataParser.parseCSV(rows);
            AIMState.setData(data);
            hideNoDataNotice();
            render();
            return;
          } catch (err) {
            console.error('Error decoding base64 data:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error processing query parameters:', err);
    }
  }

  /**
   * Handle file upload
   */
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const rows = d3.csvParse(text);
        const data = AIMDataParser.parseCSV(rows);
        AIMState.setData(data);
        hideNoDataNotice();
        render();
      } catch (err) {
        console.error('Error parsing CSV:', err);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Main render function
   */
  function render() {
    const data = AIMState.getData();
    if (!data) return;
    
    updateTitle();
    updateBreadcrumb();
    updateLegend();
    updateLenses();
    updateChart();
    updateHeatmapInfo();
    
    if (AIMState.getCurrentTab() === 'projects') {
      updateProjectsView();
    }
  }

  /**
   * Update page title
   */
  function updateTitle() {
    const data = AIMState.getData();
    if (!data) return;
    
    const name = data.title || '';
    let pageTitle;
    if (name) {
      pageTitle = `AIM: ${name}`;
    } else {
      const modeLabel = data.mode === 'personal' ? 'Personal' : 'Business';
      pageTitle = `AIM: ${modeLabel}`;
    }
    
    document.title = pageTitle;
    if (elements.titleText) {
      elements.titleText.textContent = pageTitle;
    }
  }

  /**
   * Update breadcrumb navigation
   */
  function updateBreadcrumb() {
    if (!elements.breadcrumb) return;
    
    const { crumbs } = AIMState.getBreadcrumbData();
    
    elements.breadcrumb.innerHTML = crumbs.map((crumb, i) => {
      const isLast = i === crumbs.length - 1;
      if (isLast) {
        return `<span class="current">${crumb.label}</span>`;
      }
      return `<a data-index="${i}">${crumb.label}</a><span class="separator">›</span>`;
    }).join('');
    
    // Add click handlers
    elements.breadcrumb.querySelectorAll('a').forEach((link, i) => {
      link.addEventListener('click', () => {
        crumbs[i].action?.();
      });
    });
  }

  /**
   * Update legend
   */
  function updateLegend() {
    const data = AIMState.getData();
    if (!data || !elements.legendContainer) return;
    
    const legendContainer = elements.legendContainer;
    legendContainer.selectAll('*').remove();
    
    for (let i = 1; i <= 3; i++) {
      const pillarName = data.pillarNames[i] || `Pillar ${i}`;
      const color = AIM_CONFIG.pillarColors[i - 1];
      
      const chip = legendContainer.append('div')
        .attr('class', 'legend-chip')
        .attr('tabindex', '0')
        .attr('role', 'button')
        .attr('aria-label', `Focus on ${pillarName}`)
        .on('click', () => handleLegendClick(i))
        .on('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleLegendClick(i);
          }
        });
      
      chip.append('div')
        .attr('class', 'dot')
        .style('background-color', color);
      
      chip.append('span')
        .text(pillarName);
      
      // Highlight selected pillar
      if (AIMState.getSelectedPillar() === i) {
        chip.classed('selected', true);
      }
    }
  }

  /**
   * Handle legend chip click
   */
  function handleLegendClick(pillarIdx) {
    const currentState = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    
    if (currentState === 'A') {
      AIMState.navigateToPillar(pillarIdx);
    } else if (currentState === 'B' && selectedPillar === pillarIdx) {
      AIMState.navigateToFullView();
    } else {
      AIMState.navigateToPillar(pillarIdx);
    }
  }

  /**
   * Update lenses display
   */
  function updateLenses() {
    const data = AIMState.getData();
    if (!data || !elements.lensesList) return;
    
    const lenses = data.lenses || [];
    
    if (lenses.length === 0) {
      elements.lensesList.textContent = 'No lenses';
      return;
    }
    
    elements.lensesList.innerHTML = lenses.map(lens => {
      const title = lens.title || lens.belief || 'Untitled lens';
      const pillars = lens.pillars?.length 
        ? ` (${lens.pillars.map(p => data.pillarNames[p] || p).join(', ')})`
        : '';
      return `<div class="lens-item" title="${lens.belief || ''}">${AIMUtils.truncateText(title, 30)}${pillars}</div>`;
    }).join('');
  }

  /**
   * Update heatmap info display
   */
  function updateHeatmapInfo() {
    const type = AIMState.getHeatmapType();
    const config = AIM_CONFIG.heatmapTypes[type];
    
    if (elements.heatmapInfo) {
      elements.heatmapInfo.title = config?.description || '';
    }
    
    // Update legend display based on type
    if (elements.heatmapLegend) {
      if (type === 'off') {
        elements.heatmapLegend.innerHTML = '';
      } else if (type === 'confidence') {
        elements.heatmapLegend.innerHTML = '<span style="color:#e74c3c">Low</span> → <span style="color:#27ae60">High</span> alignment';
      } else {
        const poleConfig = AIM_CONFIG.poles[type];
        if (poleConfig) {
          elements.heatmapLegend.innerHTML = `${poleConfig.left.name} ↔ ${poleConfig.right.name}`;
        }
      }
    }
  }

  /**
   * Update the sunburst chart
   */
  function updateChart() {
    AIMChartRenderer.updateChart();
  }

  /**
   * Update projects view
   */
  function updateProjectsView() {
    const data = AIMState.getData();
    if (!data || !elements.projectsList) return;
    
    const projects = data.projects || [];
    
    if (projects.length === 0) {
      elements.projectsList.innerHTML = '<p style="color:#666;">No projects defined.</p>';
      return;
    }
    
    // Sort by priority
    const sorted = [...projects].sort((a, b) => {
      return AIMUtils.parsePriority(a.priority_user || a.priority_ai) - 
             AIMUtils.parsePriority(b.priority_user || b.priority_ai);
    });
    
    elements.projectsList.innerHTML = sorted.map(project => {
      const type = project.type || 'practice';
      const typeLabel = AIM_CONFIG.projectTypes[type]?.label || type;
      
      return `
        <div class="project-card">
          <div class="project-header">
            <strong>${project.action || 'Untitled'}</strong>
            <span class="project-type">${typeLabel}</span>
          </div>
          ${project.benefit ? `<p class="project-benefit">${project.benefit}</p>` : ''}
          ${project.measure ? `<p class="project-measure">${project.start || 0} → ${project.target || '?'} ${project.measure}</p>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Build table view
   */
  function buildTableView() {
    const data = AIMState.getData();
    if (!data || !elements.nodeTableBody) return;

    const rows = [];
    
    // Core
    rows.push({
      depth: 0, pillar: '', sub: '', micro: '',
      label: 'Core',
      title: data.core.title || '',
      belief: data.core.belief || '',
      confidence: data.core.confidence || 50,
      updated: data.core.updated || ''
    });

    // Pillars, subs, micros
    for (let p = 1; p <= 3; p++) {
      rows.push({
        depth: 1, pillar: p, sub: '', micro: '',
        label: data.pillarNames[p] || '',
        title: data.pillars[p].title || '',
        belief: data.pillars[p].belief || '',
        confidence: data.pillars[p].confidence || 50,
        updated: data.pillars[p].updated || ''
      });

      for (let s = 1; s <= 3; s++) {
        rows.push({
          depth: 2, pillar: p, sub: s, micro: '',
          label: '',
          title: data.subs[p][s].title || '',
          belief: data.subs[p][s].belief || '',
          confidence: data.subs[p][s].confidence || 50,
          updated: data.subs[p][s].updated || ''
        });

        for (let m = 1; m <= 3; m++) {
          rows.push({
            depth: 3, pillar: p, sub: s, micro: m,
            label: '',
            title: data.micros[p][s][m].title || '',
            belief: data.micros[p][s][m].belief || '',
            confidence: data.micros[p][s][m].confidence || 50,
            updated: data.micros[p][s][m].updated || ''
          });
        }
      }
    }

    // Lenses
    if (data.lenses && data.lenses.length > 0) {
      data.lenses.forEach((lens, idx) => {
        const pillarNames = lens.pillars?.map(p => data.pillarNames[p] || '').filter(Boolean) || [];
        rows.push({
          depth: 4, pillar: '', sub: '', micro: '',
          label: `Lens ${idx + 1}`,
          title: lens.title || '',
          belief: lens.belief || '',
          confidence: lens.confidence || '',
          updated: lens.updated || '',
          applies: pillarNames.join(', ')
        });
      });
    }

    // Populate table
    elements.nodeTableBody.innerHTML = rows.map(row => `
      <tr>
        <td>${row.depth}</td>
        <td>${row.pillar}</td>
        <td>${row.sub}</td>
        <td>${row.micro}</td>
        <td>${row.title || row.label}</td>
        <td>${row.belief}</td>
        <td>${row.confidence}</td>
        <td>${row.updated ? AIMUtils.formatDateString(row.updated) : ''}</td>
      </tr>
    `).join('');

    // Update title input
    if (elements.editTitleInput) {
      elements.editTitleInput.value = data.title || '';
    }
  }

  // ==========================================================================
  // Tab Switching
  // ==========================================================================

  function switchTab(tab) {
    AIMState.setCurrentTab(tab);
    
    elements.aimTab?.classList.toggle('active', tab === 'aim');
    elements.projectsTab?.classList.toggle('active', tab === 'projects');
    
    if (elements.aimView) {
      elements.aimView.style.display = tab === 'aim' ? 'block' : 'none';
    }
    if (elements.projectsView) {
      elements.projectsView.style.display = tab === 'projects' ? 'block' : 'none';
    }
    
    if (tab === 'projects') {
      updateProjectsView();
    }
  }

  // ==========================================================================
  // CSV Export
  // ==========================================================================

  function downloadCSV() {
    const data = AIMState.getData();
    if (!data) return;
    
    // Build CSV rows - simplified version
    const rows = [];
    
    // Meta rows
    rows.push({ label: 'title', title: '', belief: data.title || '', confidence: '', pillars: '' });
    rows.push({ label: 'mode', title: '', belief: data.mode || '', confidence: '', pillars: '' });
    
    // Pillar names
    for (let i = 1; i <= 3; i++) {
      rows.push({ label: `pillar_name:${i}`, title: '', belief: data.pillarNames[i] || '', confidence: '', pillars: '' });
    }
    
    // Core
    rows.push({ 
      label: 'core', 
      title: data.core.title || '', 
      belief: data.core.belief || '', 
      confidence: data.core.confidence || 50, 
      pillars: '' 
    });
    
    // Pillars, subs, micros
    for (let p = 1; p <= 3; p++) {
      rows.push({ 
        label: `pillar:${p}`, 
        title: data.pillars[p].title || '', 
        belief: data.pillars[p].belief || '', 
        confidence: data.pillars[p].confidence || 50, 
        pillars: '' 
      });
      
      for (let s = 1; s <= 3; s++) {
        rows.push({ 
          label: `sub:${p}:${s}`, 
          title: data.subs[p][s].title || '', 
          belief: data.subs[p][s].belief || '', 
          confidence: data.subs[p][s].confidence || 50, 
          pillars: '' 
        });
        
        for (let m = 1; m <= 3; m++) {
          rows.push({ 
            label: `micro:${p}:${s}:${m}`, 
            title: data.micros[p][s][m].title || '', 
            belief: data.micros[p][s][m].belief || '', 
            confidence: data.micros[p][s][m].confidence || 50, 
            pillars: '' 
          });
        }
      }
    }
    
    // Lenses
    data.lenses?.forEach((lens, idx) => {
      rows.push({
        label: `lens:${idx + 1}`,
        title: lens.title || '',
        belief: lens.belief || '',
        confidence: lens.confidence || 50,
        pillars: lens.pillars?.join(';') || ''
      });
    });
    
    // Projects
    data.projects?.forEach(project => {
      rows.push({
        label: 'project',
        title: project.action || '',
        belief: project.benefit || '',
        confidence: '',
        pillars: '',
        project_type: project.type || '',
        project_action: project.action || '',
        project_measure: project.measure || '',
        project_start: project.start ?? '',
        project_target: project.target ?? '',
        project_days_per_week: project.days ?? '',
        project_benefit: project.benefit || '',
        duration: project.duration || ''
      });
    });
    
    const csvContent = d3.csvFormat(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = AIMUtils.sanitizeFilename(data.title) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // Keyboard Handling
  // ==========================================================================

  function handleKeydown(event) {
    // Escape to go back/close overlay
    if (event.key === 'Escape') {
      if (elements.tableOverlay?.style.display === 'flex') {
        elements.tableOverlay.style.display = 'none';
      } else {
        AIMState.navigateUp();
      }
      event.preventDefault();
      return;
    }
    
    // Number keys 1-3 to select pillar
    if (['1', '2', '3'].includes(event.key)) {
      const pillar = parseInt(event.key);
      AIMState.navigateToPillar(pillar);
      event.preventDefault();
    }
  }

  // ==========================================================================
  // Empty State
  // ==========================================================================

  function showNoDataNotice() {
    const aimView = document.getElementById('aimView');
    if (!aimView || document.getElementById('noDataNotice')) return;
    
    const notice = document.createElement('div');
    notice.id = 'noDataNotice';
    notice.innerHTML = `
      <strong>No AIM file found.</strong>
      <div style="margin-top:6px;">
        This page is not pointed to an AIM file yet. You can:
        <ul>
          <li>Upload an AIM file with the <em>Upload CSV</em> button above</li>
          <li>Add <code>?csv=your-file.csv</code> to the URL</li>
          <li>Add <code>?gist=GIST_ID</code> to load from a GitHub Gist</li>
        </ul>
      </div>
    `;
    aimView.prepend(notice);
  }

  function hideNoDataNotice() {
    const notice = document.getElementById('noDataNotice');
    if (notice) notice.remove();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    init,
    render,
    downloadCSV
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AIMApp.init();
});
