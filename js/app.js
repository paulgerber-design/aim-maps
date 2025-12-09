/**
 * AIM Viewer Application
 * Main entry point that coordinates all modules
 * v2.2.0 - Phase 5b: Enhanced project cards with action/measure/benefit
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
      legendContainer: document.getElementById('legend'),
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
      insightsOverview: document.getElementById('insightsOverview'),
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
   * Shows countdown modal, copies contextual message, then redirects
   * @param {Object} options - Options for the handoff
   * @param {number} options.pillar - Pillar number if focusing on a pillar
   * @param {string} options.pillarName - Pillar name for context
   * @param {string} options.context - Context type: 'pillar', 'projects', 'insights', or 'general'
   */
  function openAimOne(options = {}) {
    const { pillar, pillarName, context = 'general' } = options;
    
    // Build the viewer URL
    let viewerUrl = window.location.origin + window.location.pathname;
    if (currentGistId) {
      viewerUrl += '?gist=' + currentGistId;
    }
    if (pillar) {
      viewerUrl += (currentGistId ? '&' : '?') + 'pillar=' + pillar;
    }
    
    // Build contextual message based on what user clicked
    let message = viewerUrl;
    if (context === 'pillar' && pillarName) {
      message = `${viewerUrl}\n\nLet's continue exploring ${pillarName}.`;
    } else if (context === 'projects') {
      message = `${viewerUrl}\n\nHelp me create some project recommendations.`;
    } else if (context === 'insights') {
      message = `${viewerUrl}\n\nHelp me unlock personalized insights.`;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(message).catch(() => {
      // Fallback handled in modal
    });
    
    // Show redirect modal with countdown
    showRedirectModal(message);
  }
  
  /**
   * Show redirect modal with countdown before opening AIM ONE
   * Opens window immediately to avoid popup blocker, modal stays for user to see
   */
  function showRedirectModal(copiedMessage) {
    const aimOneUrl = AIM_CONFIG.getAimOneUrl();
    
    // Open immediately (in response to user click) to avoid popup blocker
    const newWindow = window.open(aimOneUrl, '_blank');
    
    // Create or update modal
    let modal = document.getElementById('redirectModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'redirectModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content redirect-modal">
          <h3>Opening AIM ONE</h3>
          <p class="redirect-message">We've copied your session info to the clipboard. Please paste it in AIM ONE to continue.</p>
          <p class="redirect-status" id="redirectStatus">Opening AIM ONE...</p>
          <div class="redirect-actions">
            <button class="btn-primary" id="redirectCloseBtn">Got it</button>
          </div>
          <p class="redirect-fallback">If it didn't open, <a href="#" id="redirectManualLink" target="_blank">click here</a>.</p>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Add close handler
      modal.querySelector('#redirectCloseBtn').addEventListener('click', () => {
        modal.hidden = true;
      });
      
      // Add backdrop click handler
      modal.querySelector('.modal-backdrop').addEventListener('click', () => {
        modal.hidden = true;
      });
    }
    
    const statusEl = modal.querySelector('#redirectStatus');
    const manualLink = modal.querySelector('#redirectManualLink');
    
    manualLink.href = aimOneUrl;
    
    // Update status based on whether window opened
    if (newWindow) {
      statusEl.textContent = 'AIM ONE opened in a new tab.';
      statusEl.style.color = '#2e7d32';
    } else {
      statusEl.textContent = 'Popup was blocked. Please click the link below.';
      statusEl.style.color = '#c62828';
    }
    
    manualLink.onclick = (e) => {
      e.preventDefault();
      window.open(aimOneUrl, '_blank');
    };
    
    // Show modal
    modal.hidden = false;
  }

  /**
   * Show a temporary toast notification
   */
  function showToast(message) {
    // Remove existing toast if any
    const existing = document.getElementById('aimToast');
    if (existing) existing.remove();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'aimToast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: toastFade 3s ease-in-out forwards;
    `;
    
    // Add animation style if not exists
    if (!document.getElementById('toastStyle')) {
      const style = document.createElement('style');
      style.id = 'toastStyle';
      style.textContent = `
        @keyframes toastFade {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0); }
          90% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => toast.remove(), 3000);
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
      // Only incomplete if filled is 0 (nothing entered at all)
      const isIncomplete = pillarComplete.filled === 0;
      
      html += `
        <div class="legend-chip ${isSelected ? 'selected' : ''} ${isIncomplete ? 'incomplete' : ''}" 
             data-pillar="${p}" 
             data-incomplete="${isIncomplete}"
             data-pillar-name="${name}"
             style="--pillar-color: ${color}">
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
        const isIncomplete = chip.dataset.incomplete === 'true';
        const pillarName = chip.dataset.pillarName;
        
        if (isIncomplete) {
          // Show modal for incomplete pillar (0 items filled)
          showIncompleteModal(pillarName, pillar);
        } else {
          // Navigate normally (has some content)
          AIMState.navigateToPillar(pillar);
        }
      });
    });
  }

  /**
   * Render projects section
   */
  function renderProjects() {
    const data = AIMState.getData();
    
    // Try to get projectsList, fallback to direct DOM query
    const container = elements.projectsList || document.getElementById('projectsList');
    if (!container) {
      console.warn('renderProjects: projectsList container not found');
      return;
    }
    if (!data) {
      console.warn('renderProjects: no data');
      return;
    }
    
    const state = AIMState.getState();
    const selectedPillar = AIMState.getSelectedPillar();
    
    // Determine which pillar to show projects for
    let pillarFilter = null;
    if (state === 'B' || state === 'C') {
      pillarFilter = selectedPillar;
    }
    
    // Get projects - ensure we always get an array
    let projects = [];
    try {
      if (pillarFilter) {
        projects = AIMUtils.getProjectsForPillar(data, pillarFilter) || [];
      } else {
        projects = AIMUtils.getTopProjects(data) || [];
      }
    } catch (e) {
      console.warn('Error getting projects:', e);
      projects = [];
    }
    
    // Limit display
    const initialDisplay = AIM_CONFIG.projectsInitialDisplay || 3;
    const expandedDisplay = AIM_CONFIG.projectsExpandedDisplay || 10;
    
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
    
    // Render project cards or empty state
    if (!displayProjects || displayProjects.length === 0) {
      // EMPTY STATE
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 20px;">
          <p class="insight-placeholder" style="color: #666; margin: 0 0 16px 0;">Complete more of your AIM to unlock personalized project recommendations.</p>
          <button class="btn-secondary" id="projectsAimOneBtn">Continue in AIM ONE</button>
        </div>
      `;
      
      // Bind the button
      const btn = document.getElementById('projectsAimOneBtn');
      if (btn) {
        btn.addEventListener('click', () => openAimOne({ context: 'projects' }));
      }
      
      if (elements.projectsAlternative) {
        elements.projectsAlternative.style.display = 'none';
      }
    } else {
      let html = '';
      
      displayProjects.forEach(project => {
        const pillarName = project.pillar ? (data.pillarNames[project.pillar] || `Pillar ${project.pillar}`) : '';
        const pillarColor = project.pillar ? AIM_CONFIG.pillarColors[project.pillar - 1] : '#888';
        const type = project.type || 'practice';
        const typeLabel = AIM_CONFIG.projectTypes[type]?.label || type;
        
        // Build measure string (e.g., "10 → 30 minutes, 3×/week")
        let measureStr = '';
        if (project.measure && project.measure !== '—') {
          const start = project.start && project.start !== '—' ? project.start : '';
          const target = project.target && project.target !== '—' ? project.target : '';
          const days = project.days && project.days !== '—' ? project.days : '';
          
          if (start && target) {
            measureStr = `${start} → ${target} ${project.measure}`;
          } else if (target) {
            measureStr = `${target} ${project.measure}`;
          } else if (project.measure) {
            measureStr = project.measure;
          }
          
          if (days) {
            measureStr += measureStr ? `, ${days}×/week` : `${days}×/week`;
          }
        }
        
        // Action name (use action if different from name)
        const actionName = project.action && project.action !== project.name ? project.action : '';
        
        // Benefit text
        const benefit = project.benefit && project.benefit !== '—' ? project.benefit : '';
        
        // Duration for sprints
        const duration = type === 'sprint' && project.duration ? project.duration : '';
        
        html += `
          <div class="project-card" style="--pillar-color: ${pillarColor}">
            <div class="project-card-header">
              <span class="project-card-title">${project.name || 'Untitled Project'}</span>
              <span class="project-card-type type-${type}">${typeLabel}</span>
            </div>
            ${actionName ? `<div class="project-card-action">${actionName}</div>` : ''}
            ${measureStr ? `<div class="project-card-measure">${measureStr}</div>` : ''}
            ${duration ? `<div class="project-card-duration">Duration: ${duration}</div>` : ''}
            ${benefit ? `<p class="project-card-benefit">${benefit}</p>` : ''}
            ${project.project_rationale && project.project_rationale !== '—' ? `<p class="project-card-rationale">${project.project_rationale}</p>` : ''}
            ${pillarName ? `<div class="project-card-pillar"><span class="pillar-dot" style="background: ${pillarColor}"></span>${pillarName}</div>` : ''}
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
    
    // Check if we have any insights
    const hasInsights = overview || observations || projectsInsight;
    
    // Get the overview container
    const overviewBlock = elements.insightsOverview || document.getElementById('insightsOverview');
    
    // Update overview / empty state
    if (overviewBlock) {
      if (hasInsights && overview) {
        // Show insight content
        overviewBlock.innerHTML = `<p id="insightOverviewText">${overview}</p>`;
        overviewBlock.classList.remove('empty-state');
      } else if (!hasInsights) {
        // Show empty state with button
        overviewBlock.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 20px;">
            <p class="insight-placeholder" style="color: #666; margin: 0 0 16px 0;">Complete more of your AIM to unlock personalized insights.</p>
            <button class="btn-secondary" id="insightsAimOneBtn">Continue in AIM ONE</button>
          </div>
        `;
        overviewBlock.classList.add('empty-state');
        
        // Bind the button
        const btn = document.getElementById('insightsAimOneBtn');
        if (btn) {
          btn.addEventListener('click', () => openAimOne({ context: 'insights' }));
        }
      } else {
        // Has some insights but no overview
        overviewBlock.innerHTML = '';
        overviewBlock.classList.remove('empty-state');
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
    showIncompleteModal(info.pillarName, info.pillar);
  }
  
  /**
   * Show incomplete modal for a pillar (called from wedge or legend click)
   */
  function showIncompleteModal(pillarName, pillar) {
    if (!elements.incompleteModal) return;
    
    // Update modal content
    const messages = AIM_CONFIG.incompleteMessages;
    
    if (elements.incompleteModalTitle) {
      const title = messages.pillar.replace('{pillarName}', pillarName);
      elements.incompleteModalTitle.textContent = title;
    }
    
    if (elements.incompleteModalMessage) {
      elements.incompleteModalMessage.textContent = messages.benefit;
    }
    
    // Set up CTA click - use openAimOne which includes Gist context
    if (elements.incompleteModalCta) {
      elements.incompleteModalCta.onclick = () => {
        closeIncompleteModal();
        openAimOne({ pillar: pillar, pillarName: pillarName, context: 'pillar' });
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
   * Update heatmap legend with color scale
   */
  function updateHeatmapLegend(type) {
    if (!elements.heatmapLegend) return;
    
    const config = AIM_CONFIG.heatmapTypes[type];
    const poleConfig = AIM_CONFIG.poles[type];
    
    if (type === 'off') {
      elements.heatmapLegend.innerHTML = '';
    } else if (poleConfig) {
      // Pole heatmap - show color scale with labels
      const leftName = poleConfig.left.name;
      const rightName = poleConfig.right.name;
      elements.heatmapLegend.innerHTML = `
        <div class="heatmap-scale">
          <div class="scale-bar pole-scale"></div>
          <div class="scale-labels">
            <span class="scale-left">${leftName}</span>
            <span class="scale-center">Balanced</span>
            <span class="scale-right">${rightName}</span>
          </div>
        </div>
      `;
    } else if (type === 'confidence') {
      // Confidence heatmap - show red to green
      elements.heatmapLegend.innerHTML = `
        <div class="heatmap-scale">
          <div class="scale-bar confidence-scale"></div>
          <div class="scale-labels">
            <span class="scale-left">Low</span>
            <span class="scale-right">Strong</span>
          </div>
        </div>
      `;
    } else {
      elements.heatmapLegend.innerHTML = '';
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
