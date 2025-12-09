/**
 * AIM Viewer Application
 * Main entry point that coordinates all modules
 * v2.1.0 - Phase 5a: Updated buttons, Gist passing to AIM ONE
 */

const AIMApp = (function() {
  'use strict';

  // ==========================================================================
  // DOM References
  // ==========================================================================

  let elements = {};
  let showingAlternatives = false;
  let currentGistId = null; // Track the current Gist ID

  function cacheElements() {
    elements = {
      // Main containers
      svg: d3.select('#aimChart'),
      tooltip: d3.select('#tooltip'),
      legendContainer: d3.select('#legend'),
      titleText: document.getElementById('titleText'),
      breadcrumb: document.getElementById('breadcrumb'),
      mainContent: document.getElementById('mainContent'),
      
      // Buttons
      aimOneBtn: document.getElementById('aimOneBtn'),
      viewTableBtn: document.getElementById('viewTableBtn'),
      
      // Heatmap controls
      heatmapSelect: document.getElementById('heatmapSelect'),
      heatmapInfo: document.getElementById('heatmapInfo'),
      heatmapLegend: document.getElementById('heatmapLegend'),
      
      // Collapsible sections
      projectsSection: document.getElementById('projectsSection'),
      projectsToggle: document.querySelector('#projectsSection .section-toggle'),
      projectsContent: document.getElementById('projectsContent'),
      projectsList: document.getElementById('projectsList'),
      projectsCount: document.getElementById('projectsCount'),
      projectsAlternative: document.getElementById('projectsAlternative'),
      
      insightsSection: document.getElementById('insightsSection'),
      insightsToggle: document.querySelector('#insightsSection .section-toggle'),
      insightsContent: document.getElementById('insightsContent'),
      insightOverviewText: document.getElementById('insightOverviewText'),
      insightsObservations: document.getElementById('insightsObservations'),
      insightObservationsText: document.getElementById('insightObservationsText'),
      insightsProjects: document.getElementById('insightsProjects'),
      insightProjectsText: document.getElementById('insightProjectsText'),
      
      // Incomplete modal
      incompleteModal: document.getElementById('incompleteModal'),
      incompleteModalTitle: document.getElementById('incompleteModalTitle'),
      incompleteModalMessage: document.getElementById('incompleteModalMessage'),
      incompleteModalCta: document.getElementById('incompleteModalCta'),
      incompleteModalClose: document.getElementById('incompleteModalClose'),
      
      // Table overlay
      tableOverlay: document.getElementById('tableOverlay'),
      closeTableBtn: document.getElementById('closeTableBtn'),
      tableSearchInput: document.getElementById('tableSearch'),
      tableFilterSelect: document.getElementById('tableFilterSelect'),
      editTitleInput: document.getElementById('editTitleInput'),
      downloadCsvBtn: document.getElementById('downloadCsvBtn'),
      dataTabAimBtn: document.getElementById('dataTabAimBtn'),
      dataTabProjectsBtn: document.getElementById('dataTabProjectsBtn'),
      nodeTable: document.getElementById('nodeTable'),
      projectsTable: document.getElementById('projectsTable'),
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
    
    // Initialize chart renderer with DOM references and callbacks
    AIMChartRenderer.init({
      svg: elements.svg,
      tooltip: elements.tooltip,
      legendContainer: elements.legendContainer,
      onIncompleteClick: handleIncompleteClick
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
    // AIM ONE button - opens Claude project with Gist context
    if (elements.aimOneBtn) {
      elements.aimOneBtn.addEventListener('click', () => {
        openAimOne();
      });
    }
    
    // Heatmap select
    if (elements.heatmapSelect) {
      elements.heatmapSelect.addEventListener('change', (e) => {
        AIMState.setHeatmapType(e.target.value);
        updateHeatmapLegend(e.target.value);
      });
    }
    
    // View table button
    if (elements.viewTableBtn) {
      elements.viewTableBtn.addEventListener('click', () => {
        openTableOverlay();
      });
    }
    
    // Close table button
    if (elements.closeTableBtn) {
      elements.closeTableBtn.addEventListener('click', closeTableOverlay);
    }
    
    // Table overlay backdrop click
    if (elements.tableOverlay) {
      elements.tableOverlay.addEventListener('click', (e) => {
        if (e.target === elements.tableOverlay) {
          closeTableOverlay();
        }
      });
    }
    
    // Collapsible sections
    if (elements.projectsToggle) {
      elements.projectsToggle.addEventListener('click', () => {
        toggleSection('projects');
      });
    }
    
    if (elements.insightsToggle) {
      elements.insightsToggle.addEventListener('click', () => {
        toggleSection('insights');
      });
    }
    
    // Alternative projects button
    if (elements.projectsAlternative) {
      elements.projectsAlternative.addEventListener('click', () => {
        showingAlternatives = true;
        renderProjects();
        elements.projectsAlternative.style.display = 'none';
      });
    }
    
    // Incomplete modal
    if (elements.incompleteModalClose) {
      elements.incompleteModalClose.addEventListener('click', closeIncompleteModal);
    }
    
    if (elements.incompleteModal) {
      const backdrop = elements.incompleteModal.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', closeIncompleteModal);
      }
    }
    
    // Data table tabs
    if (elements.dataTabAimBtn) {
      elements.dataTabAimBtn.addEventListener('click', () => {
        elements.dataTabAimBtn.classList.add('active');
        elements.dataTabProjectsBtn?.classList.remove('active');
        if (elements.nodeTable) elements.nodeTable.style.display = '';
        if (elements.projectsTable) elements.projectsTable.style.display = 'none';
      });
    }
    
    if (elements.dataTabProjectsBtn) {
      elements.dataTabProjectsBtn.addEventListener('click', () => {
        elements.dataTabProjectsBtn.classList.add('active');
        elements.dataTabAimBtn?.classList.remove('active');
        if (elements.nodeTable) elements.nodeTable.style.display = 'none';
        if (elements.projectsTable) elements.projectsTable.style.display = '';
        renderProjectsTable();
      });
    }
    
    // Download CSV button
    if (elements.downloadCsvBtn) {
      elements.downloadCsvBtn.addEventListener('click', downloadCSV);
    }
    
    // Table search
    if (elements.tableSearchInput) {
      elements.tableSearchInput.addEventListener('input', AIMUtils.debounce(() => {
        renderNodeTable();
      }, 200));
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!elements.incompleteModal?.hidden) {
          closeIncompleteModal();
        } else if (!elements.tableOverlay?.hidden) {
          closeTableOverlay();
        }
      }
    });
  }

  /**
   * Subscribe to state changes
   */
  function setupStateSubscription() {
    AIMState.subscribe(render);
  }

  // ==========================================================================
  // Data Loading
  // ==========================================================================

  /**
   * Load data from URL query parameters
   */
  async function loadFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const gistId = params.get('gist');
    
    if (gistId) {
      currentGistId = gistId; // Store for AIM ONE linking
      
      try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!response.ok) throw new Error('Failed to fetch gist');
        
        const gistData = await response.json();
        const files = gistData.files;
        const csvFile = Object.values(files).find(f => f.filename.endsWith('.csv'));
        
        if (csvFile) {
          const rows = d3.csvParse(csvFile.content);
          const parsed = AIMDataParser.parseCSV(rows);
          if (parsed) {
            AIMState.setData(parsed);
            render();
          }
        }
      } catch (error) {
        console.error('Error loading gist:', error);
        showNoDataNotice('Failed to load data from Gist');
      }
    }
  }

  /**
   * Open AIM ONE with current Gist context
   */
  function openAimOne(focusPillar) {
    let url = AIM_CONFIG.getAimOneUrl();
    
    // Build context for AIM ONE
    const contextParts = [];
    
    if (currentGistId) {
      contextParts.push(`gist:${currentGistId}`);
    }
    
    if (focusPillar) {
      contextParts.push(`pillar:${focusPillar}`);
    }
    
    if (contextParts.length > 0) {
      url += '?context=' + encodeURIComponent(contextParts.join(','));
    }
    
    window.open(url, '_blank');
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  /**
   * Main render function
   */
  function render() {
    const data = AIMState.getData();
    if (!data) {
      showNoDataNotice();
      return;
    }
    
    hideNoDataNotice();
    
    // Update title
    if (elements.titleText) {
      elements.titleText.textContent = data.title || 'AIM';
    }
    
    // Update breadcrumb
    renderBreadcrumb();
    
    // Render chart
    AIMChartRenderer.updateChart();
    
    // Update legend with completeness info
    renderLegend();
    
    // Render projects
    showingAlternatives = false;
    renderProjects();
    
    // Render insights
    renderInsights();
    
    // Update table title input
    if (elements.editTitleInput) {
      elements.editTitleInput.value = data.title || '';
    }
  }

  /**
   * Render breadcrumb navigation
   */
  function renderBreadcrumb() {
    const data = AIMState.getData();
    const state = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    const selectedSub = AIMState.getSelectedSub();
    
    if (!elements.breadcrumb || !data) return;
    
    let html = '<a href="#" data-action="home">AIM</a>';
    
    if (state === 'B' && selectedPillar) {
      const pillarName = data.pillarNames[selectedPillar] || `Pillar ${selectedPillar}`;
      html += '<span class="separator">›</span>';
      html += `<span class="current">${pillarName}</span>`;
    } else if (state === 'C' && selectedPillar && selectedSub) {
      const pillarName = data.pillarNames[selectedPillar] || `Pillar ${selectedPillar}`;
      const subData = data.subs[selectedPillar]?.[selectedSub];
      const subName = subData?.title || `Sub ${selectedSub}`;
      
      html += '<span class="separator">›</span>';
      html += `<a href="#" data-action="pillar" data-pillar="${selectedPillar}">${pillarName}</a>`;
      html += '<span class="separator">›</span>';
      html += `<span class="current">${subName}</span>`;
    }
    
    elements.breadcrumb.innerHTML = html;
    
    // Add click handlers
    elements.breadcrumb.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.action;
        if (action === 'home') {
          AIMState.navigateToFullView();
        } else if (action === 'pillar') {
          const pillar = parseInt(link.dataset.pillar);
          AIMState.navigateToPillar(pillar);
        }
      });
    });
  }

  /**
   * Render legend with completeness badges
   */
  function renderLegend() {
    const data = AIMState.getData();
    if (!elements.legendContainer || !data) return;
    
    const completeness = AIMUtils.getOverallCompleteness(data);
    const selectedPillar = AIMState.getSelectedPillar();
    
    let html = '';
    
    for (let p = 1; p <= 3; p++) {
      const name = data.pillarNames[p] || `Pillar ${p}`;
      const color = AIM_CONFIG.pillarColors[p - 1];
      const pillarComplete = completeness.pillars[p];
      const isSelected = selectedPillar === p;
      
      html += `
        <div class="legend-chip ${isSelected ? 'selected' : ''}" data-pillar="${p}" style="--pillar-color: ${color}">
          <span class="dot" style="background: ${color}"></span>
          <span class="pillar-name">${name}</span>
          ${!pillarComplete.complete ? `<span class="incomplete-badge">${pillarComplete.filled}/${pillarComplete.total}</span>` : ''}
        </div>
      `;
    }
    
    elements.legendContainer.innerHTML = html;
    
    // Add click handlers
    elements.legendContainer.querySelectorAll('.legend-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const pillar = parseInt(chip.dataset.pillar);
        AIMState.navigateToPillar(pillar);
      });
    });
  }

  /**
   * Render projects section
   */
  function renderProjects() {
    const data = AIMState.getData();
    
    // Try to get projectsList, fallback to projectsContent
    const container = elements.projectsList || document.getElementById('projectsList');
    if (!container || !data) {
      console.warn('renderProjects: No container or data');
      return;
    }
    
    const state = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    
    // Determine which pillar to show projects for
    let pillarFilter = null;
    if (state === 'B' || state === 'C') {
      pillarFilter = selectedPillar;
    }
    
    // Get projects
    let projects;
    if (pillarFilter) {
      // Pillar view: show projects for this pillar
      projects = AIMUtils.getProjectsForPillar(data, pillarFilter);
    } else {
      // Overall view: get top project per pillar
      projects = AIMUtils.getTopProjects(data);
    }
    
    // Limit display
    const initialDisplay = AIM_CONFIG.projectsInitialDisplay;
    const expandedDisplay = AIM_CONFIG.projectsExpandedDisplay;
    
    let displayProjects = projects;
    if (!showingAlternatives && projects.length > initialDisplay) {
      displayProjects = projects.slice(0, initialDisplay);
    } else if (showingAlternatives) {
      displayProjects = projects.slice(0, expandedDisplay);
    }
    
    // Update count badge
    if (elements.projectsCount) {
      elements.projectsCount.textContent = projects.length;
    }
    
    // Render project cards
    if (displayProjects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="insight-placeholder">Complete more of your AIM to unlock personalized project recommendations.</p>
          <button class="btn-secondary" id="projectsAimOneBtn">Continue in AIM ONE</button>
        </div>
      `;
      
      // Bind the button
      const btn = document.getElementById('projectsAimOneBtn');
      if (btn) {
        btn.addEventListener('click', () => openAimOne());
      }
      
      if (elements.projectsAlternative) {
        elements.projectsAlternative.style.display = 'none';
      }
    } else {
      let html = '';
      
      displayProjects.forEach(project => {
        const pillarName = project.pillar ? (data.pillarNames[project.pillar] || `Pillar ${project.pillar}`) : '';
        const type = project.type || 'practice';
        const typeLabel = AIM_CONFIG.projectTypes[type]?.label || type;
        
        html += `
          <div class="project-card">
            <div class="project-card-header">
              <span class="project-card-title">${project.name || 'Untitled Project'}</span>
              <span class="project-card-type">${typeLabel}</span>
            </div>
            ${project.project_rationale ? `<p class="project-card-rationale">${project.project_rationale}</p>` : ''}
            ${pillarName ? `<div class="project-card-pillar">${pillarName}</div>` : ''}
          </div>
        `;
      });
      
      container.innerHTML = html;
      
      // Show/hide alternatives button
      if (elements.projectsAlternative) {
        if (!showingAlternatives && projects.length > initialDisplay) {
          elements.projectsAlternative.style.display = '';
          elements.projectsAlternative.textContent = "Not quite right? Show alternatives";
        } else {
          elements.projectsAlternative.style.display = 'none';
        }
      }
    }
  }

  /**
   * Render insights section
   */
  function renderInsights() {
    const data = AIMState.getData();
    if (!data) return;
    
    const state = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    
    // Determine which insights to show
    let insightPrefix = 'insight_';
    if ((state === 'B' || state === 'C') && selectedPillar) {
      insightPrefix = `insight_pillar_${selectedPillar}_`;
    }
    
    // Get insight content
    const overview = data[insightPrefix + 'overview'] || data.insight_overview;
    const observations = data[insightPrefix + 'observations'] || data.insight_observations;
    const projectsInsight = data[insightPrefix + 'projects'] || data.insight_projects;
    
    // Update overview
    if (elements.insightOverviewText) {
      if (overview) {
        elements.insightOverviewText.textContent = overview;
        elements.insightOverviewText.classList.remove('insight-placeholder');
      } else {
        elements.insightOverviewText.textContent = 'Complete more of your AIM to unlock personalized insights.';
        elements.insightOverviewText.classList.add('insight-placeholder');
      }
    }
    
    // Update observations
    if (elements.insightsObservations && elements.insightObservationsText) {
      if (observations) {
        elements.insightObservationsText.textContent = observations;
        elements.insightsObservations.style.display = '';
      } else {
        elements.insightsObservations.style.display = 'none';
      }
    }
    
    // Update projects insight
    if (elements.insightsProjects && elements.insightProjectsText) {
      if (projectsInsight) {
        elements.insightProjectsText.textContent = projectsInsight;
        elements.insightsProjects.style.display = '';
      } else {
        elements.insightsProjects.style.display = 'none';
      }
    }
  }

  // ==========================================================================
  // Collapsible Sections
  // ==========================================================================

  /**
   * Toggle a collapsible section
   */
  function toggleSection(section) {
    let toggle, content;
    
    if (section === 'projects') {
      toggle = elements.projectsToggle;
      content = elements.projectsContent;
    } else if (section === 'insights') {
      toggle = elements.insightsToggle;
      content = elements.insightsContent;
    }
    
    if (!toggle || !content) return;
    
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    
    toggle.setAttribute('aria-expanded', !isExpanded);
    content.hidden = isExpanded;
  }

  // ==========================================================================
  // Incomplete Modal
  // ==========================================================================

  /**
   * Handle click on incomplete wedge
   */
  function handleIncompleteClick(info) {
    if (!elements.incompleteModal) return;
    
    // Update modal content
    const messages = AIM_CONFIG.incompleteMessages;
    
    if (elements.incompleteModalTitle) {
      const title = messages.pillar.replace('{pillarName}', info.pillarName);
      elements.incompleteModalTitle.textContent = title;
    }
    
    if (elements.incompleteModalMessage) {
      elements.incompleteModalMessage.textContent = messages.benefit;
    }
    
    // Set up CTA click - use openAimOne which includes Gist context
    if (elements.incompleteModalCta) {
      elements.incompleteModalCta.onclick = () => {
        openAimOne(info.pillar);
        closeIncompleteModal();
      };
    }
    
    // Show modal
    elements.incompleteModal.hidden = false;
  }

  /**
   * Close incomplete modal
   */
  function closeIncompleteModal() {
    if (elements.incompleteModal) {
      elements.incompleteModal.hidden = true;
    }
  }

  // ==========================================================================
  // Table Overlay
  // ==========================================================================

  /**
   * Open table overlay
   */
  function openTableOverlay() {
    if (elements.tableOverlay) {
      elements.tableOverlay.hidden = false;
      renderNodeTable();
      populateTableFilter();
    }
  }

  /**
   * Close table overlay
   */
  function closeTableOverlay() {
    if (elements.tableOverlay) {
      elements.tableOverlay.hidden = true;
    }
  }

  /**
   * Populate table filter dropdown
   */
  function populateTableFilter() {
    const data = AIMState.getData();
    if (!elements.tableFilterSelect || !data) return;
    
    let html = '<option value="all">All entries</option>';
    
    for (let p = 1; p <= 3; p++) {
      const name = data.pillarNames[p] || `Pillar ${p}`;
      html += `<option value="pillar:${p}">${name}</option>`;
    }
    
    elements.tableFilterSelect.innerHTML = html;
  }

  /**
   * Render node table
   */
  function renderNodeTable() {
    const data = AIMState.getData();
    if (!elements.nodeTableBody || !data) return;
    
    const searchTerm = elements.tableSearchInput?.value?.toLowerCase() || '';
    const filter = elements.tableFilterSelect?.value || 'all';
    
    let rows = [];
    
    // Core
    if (filter === 'all') {
      rows.push({
        depth: 'Core',
        pillar: '-',
        sub: '-',
        micro: '-',
        title: data.core.title || '',
        belief: data.core.belief || '',
        confidence: data.core.confidence || '',
        updated: data.core.updated || ''
      });
    }
    
    // Pillars, subs, micros
    for (let p = 1; p <= 3; p++) {
      if (filter !== 'all' && filter !== `pillar:${p}`) continue;
      
      const pillarData = data.pillars[p];
      rows.push({
        depth: 'Pillar',
        pillar: data.pillarNames[p] || p,
        sub: '-',
        micro: '-',
        title: pillarData.title || '',
        belief: pillarData.belief || '',
        confidence: pillarData.confidence || '',
        updated: pillarData.updated || ''
      });
      
      for (let s = 1; s <= 3; s++) {
        const subData = data.subs[p][s];
        rows.push({
          depth: 'Sub',
          pillar: data.pillarNames[p] || p,
          sub: subData.title || s,
          micro: '-',
          title: subData.title || '',
          belief: subData.belief || '',
          confidence: subData.confidence || '',
          updated: subData.updated || ''
        });
        
        for (let m = 1; m <= 3; m++) {
          const microData = data.micros[p][s][m];
          rows.push({
            depth: 'Micro',
            pillar: data.pillarNames[p] || p,
            sub: subData.title || s,
            micro: microData.title || m,
            title: microData.title || '',
            belief: microData.belief || '',
            confidence: microData.confidence || '',
            updated: microData.updated || ''
          });
        }
      }
    }
    
    // Filter by search
    if (searchTerm) {
      rows = rows.filter(row => {
        return Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Render
    let html = '';
    rows.forEach(row => {
      html += `
        <tr>
          <td>${row.depth}</td>
          <td>${row.pillar}</td>
          <td>${row.sub}</td>
          <td>${row.micro}</td>
          <td>${row.title}</td>
          <td>${row.belief}</td>
          <td>${row.confidence}</td>
          <td>${row.updated}</td>
        </tr>
      `;
    });
    
    elements.nodeTableBody.innerHTML = html;
  }

  /**
   * Render projects table
   */
  function renderProjectsTable() {
    const data = AIMState.getData();
    if (!elements.projectsTableBody || !data) return;
    
    const projects = data.projects || [];
    
    let html = '';
    projects.forEach(project => {
      const pillarName = project.pillar ? (data.pillarNames[project.pillar] || `Pillar ${project.pillar}`) : '-';
      
      html += `
        <tr>
          <td>${project.name || ''}</td>
          <td>${project.type || ''}</td>
          <td>${project.priority_ai || ''}</td>
          <td>${project.project_rationale || ''}</td>
          <td>${pillarName}</td>
        </tr>
      `;
    });
    
    elements.projectsTableBody.innerHTML = html || '<tr><td colspan="5">No projects</td></tr>';
  }

  // ==========================================================================
  // Heatmap
  // ==========================================================================

  /**
   * Update heatmap legend
   */
  function updateHeatmapLegend(type) {
    if (!elements.heatmapLegend) return;
    
    const config = AIM_CONFIG.heatmapTypes[type];
    if (config) {
      elements.heatmapLegend.textContent = config.description;
    } else {
      elements.heatmapLegend.textContent = '';
    }
    
    // Update info tooltip
    if (elements.heatmapInfo && config) {
      elements.heatmapInfo.title = config.description;
    }
  }

  // ==========================================================================
  // CSV Download
  // ==========================================================================

  /**
   * Download current data as CSV
   */
  function downloadCSV() {
    const data = AIMState.getData();
    if (!data) return;
    
    // Update title from input if present
    if (elements.editTitleInput) {
      data.title = elements.editTitleInput.value || data.title;
    }
    
    const csv = AIMDataParser.exportToCSV(data);
    const filename = AIMUtils.sanitizeFilename(data.title) + '.csv';
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ==========================================================================
  // Empty State
  // ==========================================================================

  /**
   * Show no data notice
   */
  function showNoDataNotice(message) {
    const chartWrapper = document.getElementById('chartWrapper');
    if (!chartWrapper) return;
    
    // Check if notice already exists
    let notice = document.getElementById('noDataNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'noDataNotice';
      chartWrapper.appendChild(notice);
    }
    
    notice.innerHTML = `
      <h3>Welcome to AIM Viewer</h3>
      <p>${message || 'Start with AIM ONE to create your personalized map.'}</p>
      <button class="btn-primary" id="noDataAimOneBtn">Start with AIM ONE</button>
    `;
    
    // Bind AIM ONE button
    const aimOneBtn = document.getElementById('noDataAimOneBtn');
    if (aimOneBtn) {
      aimOneBtn.addEventListener('click', () => openAimOne());
    }
    
    notice.style.display = 'block';
  }

  /**
   * Hide no data notice
   */
  function hideNoDataNotice() {
    const notice = document.getElementById('noDataNotice');
    if (notice) {
      notice.style.display = 'none';
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    init
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AIMApp.init();
});
