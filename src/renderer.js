// Application State
let apps = [];
let settings = {
  autoHideOnLaunch: true,
  globalHotkey: 'Alt+Space',
  opacity: 0.95,
  bgTheme: 'apple-vibrant',
  customBgColor: '#1e1b4b',
  gradStartColor: '#c026d3',
  gradEndColor: '#1e1b4b',
  tabs: ['Home', 'Dev', 'Tools', 'Utilities']
};

let currentTab = 'Home'; // Default to Home
let searchQuery = '';
let activeContextMenuApp = null;
let selectedEmoji = '';

// DOM Elements
const fullscreenCanvas = document.getElementById('fullscreenCanvas');
const canvasBgLayer = document.getElementById('canvasBgLayer');
const gridWrapper = document.getElementById('gridWrapper');
const appsGrid = document.getElementById('appsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const categoryFilters = document.getElementById('categoryFilters');
const settingsBtn = document.getElementById('settingsBtn');
const closeBtn = document.getElementById('closeBtn');
const dropOverlay = document.getElementById('dropOverlay');

// Settings Modal Elements
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const modalTabBtns = document.querySelectorAll('.apple-modal-tabs .tab-btn');
const modalTabContents = document.querySelectorAll('.modal-card .tab-content');

// Installed Apps Live Search
const installedAppsSearchInput = document.getElementById('installedSearchInput');
const clearInstalledSearchBtn = document.getElementById('clearInstalledSearchBtn');
const installedAppTabSelect = document.getElementById('installedAppTabSelect');
const installedAppsList = document.getElementById('installedAppsList');

// Subtabs in Add Modal
const subtabSearchBtn = document.getElementById('subtabSearchBtn');
const subtabCustomBtn = document.getElementById('subtabCustomBtn');
const subviewSearch = document.getElementById('subviewSearch');
const subviewCustom = document.getElementById('subviewCustom');

let allInstalledApps = [];
let installedAppsLoading = false;
let installedIconCache = new Map();

// Add Tab in Settings
const browseAppBtn = document.getElementById('browseAppBtn');
const browseFolderBtn = document.getElementById('browseFolderBtn');
const addNameInput = document.getElementById('addNameInput');
const addPathInput = document.getElementById('addPathInput');
const addTabSelect = document.getElementById('addTabSelect');
const emojiPickerRow = document.getElementById('emojiPickerRow');
const confirmAddBtn = document.getElementById('confirmAddBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');

// Background Tab in Settings
const wallpaperPresetsGrid = document.getElementById('wallpaperPresetsGrid');
const customSolidColorInput = document.getElementById('customSolidColorInput');
const customSolidColorText = document.getElementById('customSolidColorText');
const applySolidColorBtn = document.getElementById('applySolidColorBtn');
const gradStartColorInput = document.getElementById('gradStartColorInput');
const gradEndColorInput = document.getElementById('gradEndColorInput');
const applyGradColorBtn = document.getElementById('applyGradColorBtn');
const opacitySlider = document.getElementById('opacitySlider');
const opacityVal = document.getElementById('opacityVal');
const customSolidPreview = document.getElementById('customSolidPreview');

// Manage Tabs in Settings
const tabsManagerList = document.getElementById('tabsManagerList');
const newTabInput = document.getElementById('newTabInput');
const createNewTabBtn = document.getElementById('createNewTabBtn');

// General / Hotkey in Settings
const autoHideCheckbox = document.getElementById('autoHideCheckbox');
const hotkeyPresetBtns = document.querySelectorAll('.hotkey-preset-btn');
const customHotkeyInput = document.getElementById('customHotkeyInput');
const saveCustomHotkeyBtn = document.getElementById('saveCustomHotkeyBtn');
const hotkeyFeedback = document.getElementById('hotkeyFeedback');

// Quick Tab Modal
const quickTabModal = document.getElementById('quickTabModal');
const quickTabInput = document.getElementById('quickTabInput');
const closeQuickTabBtn = document.getElementById('closeQuickTabBtn');
const cancelQuickTabBtn = document.getElementById('cancelQuickTabBtn');
const confirmQuickTabBtn = document.getElementById('confirmQuickTabBtn');

// Context Menus
const contextMenu = document.getElementById('contextMenu');
const ctxLaunch = document.getElementById('ctxLaunch');
const ctxRunAdmin = document.getElementById('ctxRunAdmin');
const ctxOpenFolder = document.getElementById('ctxOpenFolder');
const ctxMoveToTab = document.getElementById('ctxMoveToTab');
const ctxTabsSubmenu = document.getElementById('ctxTabsSubmenu');
const ctxMoveLeft = document.getElementById('ctxMoveLeft');
const ctxMoveRight = document.getElementById('ctxMoveRight');
const ctxRemove = document.getElementById('ctxRemove');

const desktopContextMenu = document.getElementById('desktopContextMenu');
const ctxDeskSettings = document.getElementById('ctxDeskSettings');
const ctxDeskAdd = document.getElementById('ctxDeskAdd');
const ctxDeskNewTab = document.getElementById('ctxDeskNewTab');
const ctxDeskExit = document.getElementById('ctxDeskExit');

// Vibrant Fallback Gradients for Icons
const ICON_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
  'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
];

function getGradientForName(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ICON_GRADIENTS.length;
  return ICON_GRADIENTS[index];
}

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
async function init() {
  apps = await window.api.getApps();
  const loadedSettings = await window.api.getSettings();
  if (loadedSettings && typeof loadedSettings === 'object') {
    settings = { ...settings, ...loadedSettings };
  }

  // Ensure default tabs exist
  if (!Array.isArray(settings.tabs) || settings.tabs.length === 0) {
    settings.tabs = ['Home', 'Dev', 'Tools', 'Utilities'];
  }

  // Include any existing app categories into tabs so nothing is hidden
  apps.forEach(app => {
    if (app.category && !settings.tabs.includes(app.category)) {
      settings.tabs.push(app.category);
    }
  });

  // Current tab defaults to 'all' so all shortcuts are immediately visible like Apple Launchpad
  currentTab = 'all';

  // Apply Theme & Background
  applyTheme(settings.bgTheme);

  // Sync settings inputs
  if (settings.customBgColor) {
    customSolidColorInput.value = settings.customBgColor;
    customSolidColorText.value = settings.customBgColor;
    if (customSolidPreview) customSolidPreview.style.background = settings.customBgColor;
  }
  if (settings.gradStartColor) gradStartColorInput.value = settings.gradStartColor;
  if (settings.gradEndColor) gradEndColorInput.value = settings.gradEndColor;
  if (settings.opacity !== undefined) {
    opacitySlider.value = Math.round(settings.opacity * 100);
    opacityVal.textContent = `${opacitySlider.value}%`;
  }
  if (settings.autoHideOnLaunch !== undefined) {
    autoHideCheckbox.checked = settings.autoHideOnLaunch;
  }

  // Render UI
  renderTabs();
  renderApps();
  updateAddTabDropdown();
  renderTabsManagerList();

  // Highlight active hotkey preset
  const hotkey = await window.api.getGlobalHotkey();
  updateHotkeyDisplays(hotkey);

  // Listeners
  window.api.onWindowShown(() => {
    searchQuery = '';
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderApps();
    searchInput.focus();
  });

  setupEventListeners();
}

// ----------------------------------------------------
// Theme & Background Controller
// ----------------------------------------------------
function applyTheme(themeName) {
  settings.bgTheme = themeName;

  // Clear existing theme classes
  canvasBgLayer.className = 'canvas-bg-layer';

  if (themeName === 'custom-solid') {
    canvasBgLayer.style.background = settings.customBgColor || '#1e1b4b';
  } else if (themeName === 'custom-gradient') {
    const start = settings.gradStartColor || '#c026d3';
    const end = settings.gradEndColor || '#1e1b4b';
    canvasBgLayer.style.background = `radial-gradient(ellipse at 50% 18%, ${start} 0%, ${end} 100%)`;
  } else {
    canvasBgLayer.style.background = '';
    const themeMap = {
      'apple-vibrant': 'theme-vibrant',
      'apple-monterey': 'theme-monterey',
      'apple-ventura': 'theme-ventura',
      'apple-bigsur': 'theme-bigsur',
      'apple-dark': 'theme-dark',
      'apple-aurora': 'theme-aurora',
      'pure-black': 'theme-black'
    };
    canvasBgLayer.classList.add(themeMap[themeName] || 'theme-vibrant');
  }

  // Opacity
  const op = settings.opacity !== undefined ? settings.opacity : 0.95;
  canvasBgLayer.style.opacity = op;

  // Sync active card in presets grid
  document.querySelectorAll('.theme-preset-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === themeName);
  });
}

function updateHotkeyDisplays(hotkey) {
  hotkeyPresetBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.key.toLowerCase() === (hotkey || '').toLowerCase());
  });
}

// ----------------------------------------------------
// Dynamic Tabs Controller
// ----------------------------------------------------
function renderTabs() {
  categoryFilters.innerHTML = '';

  // 1. "All" Tab
  const allBtn = document.createElement('button');
  allBtn.className = 'apple-tab-pill' + (currentTab === 'all' ? ' active' : '');
  allBtn.dataset.tab = 'all';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentTab = 'all';
    renderTabs();
    renderApps();
  });
  categoryFilters.appendChild(allBtn);

  // 2. User-Created Tabs (e.g. Home, Dev, Tools...)
  settings.tabs.forEach(tab => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'apple-tab-pill' + (currentTab.toLowerCase() === tab.toLowerCase() ? ' active' : '');
    tabBtn.dataset.tab = tab;
    tabBtn.textContent = tab;

    tabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTab = tab;
      renderTabs();
      renderApps();
    });

    // Drag-and-drop onto tab pill to reassign app
    tabBtn.addEventListener('dragover', (e) => {
      e.preventDefault();
      tabBtn.classList.add('drag-over');
    });

    tabBtn.addEventListener('dragleave', () => {
      tabBtn.classList.remove('drag-over');
    });

    tabBtn.addEventListener('drop', async (e) => {
      e.preventDefault();
      tabBtn.classList.remove('drag-over');
      const draggedAppId = e.dataTransfer.getData('text/plain');
      const targetApp = apps.find(a => a.id === draggedAppId);
      if (targetApp) {
        targetApp.category = tab;
        await window.api.saveApps(apps);
        renderApps();
        renderTabsManagerList();
      }
    });

    categoryFilters.appendChild(tabBtn);
  });

  // 3. Inline "+ New Tab" button
  const addTabBtn = document.createElement('button');
  addTabBtn.className = 'apple-tab-add-btn';
  addTabBtn.title = 'Create New Tab';
  addTabBtn.textContent = '+';
  addTabBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openQuickTabModal();
  });
  categoryFilters.appendChild(addTabBtn);
}

function updateAddTabDropdown() {
  addTabSelect.innerHTML = '';
  if (installedAppTabSelect) installedAppTabSelect.innerHTML = '';

  settings.tabs.forEach(tab => {
    const opt = document.createElement('option');
    opt.value = tab;
    opt.textContent = tab;
    if (currentTab !== 'all' && currentTab.toLowerCase() === tab.toLowerCase()) {
      opt.selected = true;
    }
    addTabSelect.appendChild(opt);

    if (installedAppTabSelect) {
      const opt2 = document.createElement('option');
      opt2.value = tab;
      opt2.textContent = tab;
      if (currentTab !== 'all' && currentTab.toLowerCase() === tab.toLowerCase()) {
        opt2.selected = true;
      }
      installedAppTabSelect.appendChild(opt2);
    }
  });
}

// ----------------------------------------------------
// Installed PC Apps Explorer & 1-Click Adder
// ----------------------------------------------------
async function loadInstalledApps() {
  if (allInstalledApps.length > 0) {
    renderInstalledAppsList();
    return;
  }

  installedAppsLoading = true;
  if (installedAppsList) {
    installedAppsList.innerHTML = '<div class="installed-empty-hint">Scanning installed applications...</div>';
  }

  try {
    const scanned = await window.api.scanInstalledApps();
    allInstalledApps = Array.isArray(scanned) ? scanned : [];
  } catch (err) {
    console.warn('Error scanning installed apps:', err);
    allInstalledApps = [];
  } finally {
    installedAppsLoading = false;
    renderInstalledAppsList();
  }
}

function renderInstalledAppsList() {
  if (!installedAppsList) return;
  const query = (installedAppsSearchInput ? installedAppsSearchInput.value : '').trim().toLowerCase();

  const filtered = allInstalledApps.filter(app => {
    return !query || app.name.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    installedAppsList.innerHTML = `
      <div class="installed-empty-hint">
        ${query ? `No installed apps matching "${query}"` : 'No installed apps detected'}
      </div>
    `;
    return;
  }

  installedAppsList.innerHTML = '';

  const existingPaths = new Set(apps.map(a => (a.path || '').toLowerCase()));
  const existingNames = new Set(apps.map(a => (a.name || '').toLowerCase()));

  // Render top 50 matches for instant 60fps performance
  filtered.slice(0, 50).forEach(app => {
    const isAlreadyAdded = existingPaths.has(app.path.toLowerCase()) || existingNames.has(app.name.toLowerCase());

    const row = document.createElement('div');
    row.className = 'installed-app-row';

    const left = document.createElement('div');
    left.className = 'installed-app-left';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'installed-app-icon-wrap';

    if (installedIconCache.has(app.path)) {
      const cached = installedIconCache.get(app.path);
      if (cached) {
        const img = document.createElement('img');
        img.className = 'installed-app-icon';
        img.src = cached;
        iconWrap.appendChild(img);
      } else {
        iconWrap.appendChild(createInstalledAppFallback(app.name));
      }
    } else {
      const fallback = createInstalledAppFallback(app.name);
      iconWrap.appendChild(fallback);

      // Async extract icon on demand
      window.api.extractIcon(app.path).then(icon => {
        installedIconCache.set(app.path, icon || null);
        if (icon && iconWrap.contains(fallback)) {
          fallback.remove();
          const img = document.createElement('img');
          img.className = 'installed-app-icon';
          img.src = icon;
          iconWrap.appendChild(img);
        }
      });
    }

    const info = document.createElement('div');
    info.className = 'installed-app-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'installed-app-name';
    nameEl.textContent = app.name;

    const pathEl = document.createElement('div');
    pathEl.className = 'installed-app-path';
    pathEl.textContent = app.path;

    info.appendChild(nameEl);
    info.appendChild(pathEl);

    left.appendChild(iconWrap);
    left.appendChild(info);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'installed-app-add-btn' + (isAlreadyAdded ? ' added' : '');
    addBtn.textContent = isAlreadyAdded ? '✓ Added' : '+ Add';
    if (isAlreadyAdded) addBtn.disabled = true;

    addBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (addBtn.disabled) return;

      const targetTab = (installedAppTabSelect ? installedAppTabSelect.value : '') || settings.tabs[0] || 'Home';
      let icon = installedIconCache.get(app.path);
      if (!icon) {
        icon = await window.api.extractIcon(app.path);
        if (icon) installedIconCache.set(app.path, icon);
      }

      const newApp = {
        id: 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: app.name,
        path: app.path,
        category: targetTab,
        icon: icon || null,
        launchCount: 0
      };

      apps.push(newApp);
      await window.api.saveApps(apps);

      addBtn.textContent = '✓ Added';
      addBtn.classList.add('added');
      addBtn.disabled = true;

      renderApps();
      renderTabsManagerList();
    });

    row.appendChild(left);
    row.appendChild(addBtn);

    installedAppsList.appendChild(row);
  });
}

function createInstalledAppFallback(name) {
  const div = document.createElement('div');
  div.className = 'installed-app-fallback';
  div.style.background = getGradientForName(name);
  const clean = (name || '').replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const parts = clean.split(/\s+/);
  let letters = '⚡';
  if (parts.length >= 2 && parts[0] && parts[1]) {
    letters = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (clean.length > 0) {
    letters = clean.slice(0, 2).toUpperCase();
  }
  div.textContent = letters;
  return div;
}

function renderTabsManagerList() {
  tabsManagerList.innerHTML = '';
  settings.tabs.forEach((tab, index) => {
    const count = apps.filter(a => a.category && a.category.toLowerCase() === tab.toLowerCase()).length;

    const item = document.createElement('div');
    item.className = 'tab-manager-item';

    const left = document.createElement('div');
    left.className = 'tab-manager-left';
    left.innerHTML = `
      <span class="tab-badge-icon">📑</span>
      <span class="tab-name-text">${tab}</span>
      <span class="tab-apps-count">(${count} ${count === 1 ? 'app' : 'apps'})</span>
    `;

    const actions = document.createElement('div');
    actions.className = 'tab-manager-actions';

    // Rename Tab
    const renameBtn = document.createElement('button');
    renameBtn.className = 'tab-action-btn';
    renameBtn.textContent = 'Rename';
    renameBtn.addEventListener('click', async () => {
      const newName = prompt(`Rename tab "${tab}" to:`, tab);
      if (newName && newName.trim() && newName.trim() !== tab) {
        const clean = newName.trim();
        // Update tab in settings
        settings.tabs[index] = clean;
        // Update all apps that had this tab
        apps.forEach(a => {
          if (a.category && a.category.toLowerCase() === tab.toLowerCase()) {
            a.category = clean;
          }
        });
        if (currentTab.toLowerCase() === tab.toLowerCase()) {
          currentTab = clean;
        }
        await window.api.saveSettings(settings);
        await window.api.saveApps(apps);
        renderTabs();
        renderApps();
        updateAddTabDropdown();
        renderTabsManagerList();
      }
    });

    // Delete Tab (allowed if more than 1 tab)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tab-action-btn delete-tab';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      if (settings.tabs.length <= 1) {
        alert('You must have at least one tab.');
        return;
      }
      if (confirm(`Delete tab "${tab}"? Any apps in this tab will move to "${settings.tabs[0] === tab ? settings.tabs[1] : settings.tabs[0]}".`)) {
        const fallbackTab = settings.tabs[0] === tab ? settings.tabs[1] : settings.tabs[0];
        settings.tabs = settings.tabs.filter(t => t !== tab);
        apps.forEach(a => {
          if (a.category && a.category.toLowerCase() === tab.toLowerCase()) {
            a.category = fallbackTab;
          }
        });
        if (currentTab.toLowerCase() === tab.toLowerCase()) {
          currentTab = fallbackTab;
        }
        await window.api.saveSettings(settings);
        await window.api.saveApps(apps);
        renderTabs();
        renderApps();
        updateAddTabDropdown();
        renderTabsManagerList();
      }
    });

    actions.appendChild(renameBtn);
    if (settings.tabs.length > 1) {
      actions.appendChild(deleteBtn);
    }

    item.appendChild(left);
    item.appendChild(actions);
    tabsManagerList.appendChild(item);
  });
}

// ----------------------------------------------------
// Apple Apps Grid Rendering (Zero Number Badges)
// ----------------------------------------------------
function renderApps() {
  appsGrid.innerHTML = '';

  const filtered = apps.filter(app => {
    const matchesCategory = currentTab === 'all' || (app.category && app.category.toLowerCase() === currentTab.toLowerCase());
    const matchesSearch = !searchQuery || app.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0 && searchQuery) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(app => {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.dataset.id = app.id;
    card.draggable = true;
    card.title = `${app.name}\n${app.path || ''}\n(Drag to reorder)`;

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-wrapper';

    // Render Icon: Custom Emoji, Folder, Extracted High-Res Icon, or Apple Gradient Monogram
    const hasEmoji = app.emoji && typeof app.emoji === 'string' && app.emoji.trim() !== '' && app.emoji !== 'auto';
    const isDriveIcon = app.icon && (
      app.icon.includes('iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAADfUlEQVR4nOyYTW/TMBjHH3dN15c1') ||
      app.icon.includes('AAADfUlEQVR4nOyYTW/TMBjHH3dN15c1axcNcQCRXuAz7LjL+iU4c+MDIHHniMSNM2c+wggHpLLTvgASrXhT2TrGKjZVqm2ex4kdJ0vWbSVbkfrfWqe2E') ||
      app.icon.includes('iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rht')
    );

    if (hasEmoji) {
      // 1. If user explicitly assigned an emoji/icon, display it prominently
      const emojiIcon = createFallbackIcon(app.name, false, app.emoji.trim());
      iconWrapper.appendChild(emojiIcon);
    } else if (app.icon && app.icon.length > 50 && !isDriveIcon) {
      // 2. High-res custom .ico or extracted application icon
      const img = document.createElement('img');
      img.className = 'app-icon';
      img.src = app.icon;
      img.alt = app.name;
      img.onerror = () => {
        img.remove();
        if (app.isFolder) {
          iconWrapper.appendChild(createFolderIcon());
        } else {
          iconWrapper.appendChild(createFallbackIcon(app.name, app.isUrl));
        }
      };
      iconWrapper.appendChild(img);
    } else if (app.isFolder) {
      // 3. Apple macOS folder icon for folders without custom .ico
      iconWrapper.appendChild(createFolderIcon());
    } else {
      // 4. Sleek Apple gradient monogram fallback
      const fallback = createFallbackIcon(app.name, app.isUrl);
      iconWrapper.appendChild(fallback);
    }

    // Crisp White Apple Typography Label
    const nameLabel = document.createElement('div');
    nameLabel.className = 'app-name';
    nameLabel.textContent = app.name;

    card.appendChild(iconWrapper);
    card.appendChild(nameLabel);

    // Click to Launch
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerLaunch(app, card);
    });

    // Right-Click Context Menu
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openContextMenu(e, app);
    });

    // Drag-to-Reorder between apps
    card.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', app.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', (e) => {
      e.stopPropagation();
      card.classList.remove('dragging');
      document.querySelectorAll('.app-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (!card.classList.contains('dragging')) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('drag-over');

      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== app.id) {
        const fromIndex = apps.findIndex(a => a.id === draggedId);
        const toIndex = apps.findIndex(a => a.id === app.id);
        if (fromIndex !== -1 && toIndex !== -1) {
          const [moved] = apps.splice(fromIndex, 1);
          apps.splice(toIndex, 0, moved);
          await window.api.saveApps(apps);
          renderApps();
        }
      }
    });

    appsGrid.appendChild(card);
  });
}

function createFolderIcon() {
  const folder = document.createElement('div');
  folder.className = 'app-icon-fallback app-icon-folder';
  folder.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
  folder.innerHTML = `
    <svg width="52" height="52" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  `;
  return folder;
}

function createFallbackIcon(name, isUrl, customEmoji) {
  const fallback = document.createElement('div');
  fallback.className = 'app-icon-fallback';
  fallback.style.background = getGradientForName(name);

  if (customEmoji) {
    fallback.classList.add('emoji-icon');
    fallback.textContent = customEmoji;
    fallback.style.fontSize = '52px';
    fallback.style.lineHeight = '1';
    fallback.style.display = 'flex';
    fallback.style.alignItems = 'center';
    fallback.style.justifyContent = 'center';
  } else if (isUrl) {
    fallback.textContent = '🌐';
    fallback.style.fontSize = '46px';
    fallback.style.lineHeight = '1';
  } else {
    const cleanName = (name || '').replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const parts = cleanName.split(/\s+/);
    let letters = '⚡';
    if (parts.length >= 2 && parts[0] && parts[1]) {
      letters = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (cleanName.length > 0) {
      letters = cleanName.slice(0, 2).toUpperCase();
    }
    fallback.textContent = letters;
    fallback.style.fontSize = letters.length > 1 ? '30px' : '36px';
  }
  return fallback;
}

// ----------------------------------------------------
// App Launching
// ----------------------------------------------------
async function triggerLaunch(app, cardElement) {
  if (cardElement) {
    cardElement.classList.add('launching');
  }

  app.launchCount = (app.launchCount || 0) + 1;
  window.api.saveApps(apps);

  await window.api.launchApp(app.path, false);
}

// ----------------------------------------------------
// Context Menus
// ----------------------------------------------------
function openContextMenu(e, app) {
  hideAllContextMenus();
  activeContextMenuApp = app;
  contextMenu.classList.remove('hidden');

  // Populate Move to Tab submenu
  ctxTabsSubmenu.innerHTML = '';
  settings.tabs.forEach(tab => {
    const item = document.createElement('div');
    item.className = 'submenu-item' + (app.category && app.category.toLowerCase() === tab.toLowerCase() ? ' current-tab' : '');
    item.textContent = (app.category && app.category.toLowerCase() === tab.toLowerCase() ? '✓ ' : '  ') + tab;
    item.addEventListener('click', async (evt) => {
      evt.stopPropagation();
      app.category = tab;
      await window.api.saveApps(apps);
      renderApps();
      renderTabsManagerList();
      hideAllContextMenus();
    });
    ctxTabsSubmenu.appendChild(item);
  });

  positionMenu(contextMenu, e.clientX, e.clientY);
}

function openDesktopContextMenu(e) {
  hideAllContextMenus();
  desktopContextMenu.classList.remove('hidden');
  positionMenu(desktopContextMenu, e.clientX, e.clientY);
}

function positionMenu(menu, clientX, clientY) {
  let x = clientX;
  let y = clientY;
  const menuWidth = 210;
  const menuHeight = 170;

  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 20;
  if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 20;

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

function hideAllContextMenus() {
  contextMenu.classList.add('hidden');
  desktopContextMenu.classList.add('hidden');
  activeContextMenuApp = null;
}

// ----------------------------------------------------
// Settings Modal & Tabs Handlers
// ----------------------------------------------------
function openSettingsModal(targetTabName = 'tabAdd') {
  hideAllContextMenus();
  updateAddTabDropdown();
  renderTabsManagerList();

  modalTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === targetTabName);
  });
  modalTabContents.forEach(content => {
    content.classList.toggle('active', content.id === targetTabName);
  });

  if (targetTabName === 'tabAdd') {
    loadInstalledApps();
  }

  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

function openQuickTabModal() {
  quickTabInput.value = '';
  quickTabModal.classList.remove('hidden');
  setTimeout(() => quickTabInput.focus(), 50);
}

function closeQuickTabModal() {
  quickTabModal.classList.add('hidden');
}

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------
function setupEventListeners() {
  // Dismiss modals / context menus on canvas click
  fullscreenCanvas.addEventListener('click', (e) => {
    if (e.target === fullscreenCanvas || e.target === canvasBgLayer) {
      hideAllContextMenus();
      window.api.hideWindow();
    } else {
      hideAllContextMenus();
    }
  });

  // Right-click on canvas wallpaper: open Desktop Context Menu
  fullscreenCanvas.addEventListener('contextmenu', (e) => {
    if (e.target === fullscreenCanvas || e.target === canvasBgLayer || e.target === gridWrapper || e.target === appsGrid) {
      e.preventDefault();
      openDesktopContextMenu(e);
    }
  });

  // Top Corner Buttons
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSettingsModal('tabAdd');
  });

  closeBtn.addEventListener('click', () => {
    window.api.hideWindow();
  });

  closeSettingsModalBtn.addEventListener('click', closeSettingsModal);

  // Settings Modal internal tab switching
  modalTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modalTabBtns.forEach(b => b.classList.remove('active'));
      modalTabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const targetContent = document.getElementById(btn.dataset.tab);
      if (targetContent) targetContent.classList.add('active');
      if (btn.dataset.tab === 'tabAdd') {
        loadInstalledApps();
      }
    });
  });

  // Add Tab Sub-tabs Switcher (Search vs Custom)
  if (subtabSearchBtn && subtabCustomBtn) {
    subtabSearchBtn.addEventListener('click', () => {
      subtabSearchBtn.classList.add('active');
      subtabCustomBtn.classList.remove('active');
      subviewSearch.classList.remove('hidden');
      subviewCustom.classList.add('hidden');
      loadInstalledApps();
    });

    subtabCustomBtn.addEventListener('click', () => {
      subtabCustomBtn.classList.add('active');
      subtabSearchBtn.classList.remove('active');
      subviewCustom.classList.remove('hidden');
      subviewSearch.classList.add('hidden');
    });
  }

  // Installed Apps Live Search
  if (installedAppsSearchInput) {
    installedAppsSearchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearInstalledSearchBtn) {
        clearInstalledSearchBtn.classList.toggle('hidden', !val);
      }
      renderInstalledAppsList();
    });
  }

  if (clearInstalledSearchBtn) {
    clearInstalledSearchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      installedAppsSearchInput.value = '';
      clearInstalledSearchBtn.classList.add('hidden');
      renderInstalledAppsList();
      installedAppsSearchInput.focus();
    });
  }

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    clearSearchBtn.classList.toggle('hidden', !searchQuery);
    renderApps();
  });

  clearSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    searchQuery = '';
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderApps();
    searchInput.focus();
  });

  const emptyStateSearchInstalledBtn = document.getElementById('emptyStateSearchInstalledBtn');
  if (emptyStateSearchInstalledBtn) {
    emptyStateSearchInstalledBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSettingsModal('tabAdd');
      if (installedAppsSearchInput) {
        installedAppsSearchInput.value = searchQuery;
        if (clearInstalledSearchBtn) clearInstalledSearchBtn.classList.toggle('hidden', !searchQuery);
        renderInstalledAppsList();
        setTimeout(() => installedAppsSearchInput.focus(), 100);
      }
    });
  }

  // Add App / Folder Browse Buttons
  browseAppBtn.addEventListener('click', async () => {
    const selected = await window.api.browseApp();
    if (selected) {
      addNameInput.value = selected.name;
      addPathInput.value = selected.path;
      addPathInput.dataset.icon = selected.icon || '';
      addPathInput.dataset.isFolder = '';
    }
  });

  browseFolderBtn.addEventListener('click', async () => {
    const selected = await window.api.browseFolder();
    if (selected) {
      addNameInput.value = selected.name;
      addPathInput.value = selected.path;
      addPathInput.dataset.icon = selected.icon || '';
      addPathInput.dataset.isFolder = 'true';
    }
  });

  // Emoji Picker
  emojiPickerRow.addEventListener('click', (e) => {
    if (e.target.classList.contains('emoji-btn')) {
      emojiPickerRow.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedEmoji = e.target.dataset.emoji;
    }
  });

  cancelAddBtn.addEventListener('click', closeSettingsModal);

  // Confirm Add App or Folder
  confirmAddBtn.addEventListener('click', async () => {
    const name = addNameInput.value.trim();
    const pathVal = addPathInput.value.trim();
    const assignedTab = addTabSelect.value || settings.tabs[0] || 'Home';
    let isFolder = addPathInput.dataset.isFolder === 'true';

    if (!name || !pathVal) {
      alert('Please provide a name and path (or choose Browse App / Folder).');
      return;
    }

    const isUrl = pathVal.startsWith('http://') || pathVal.startsWith('https://');
    let icon = addPathInput.dataset.icon || null;

    if (!icon && !isUrl) {
      const info = await window.api.inspectPath(pathVal);
      if (info) {
        isFolder = isFolder || info.isFolder;
        icon = info.icon;
      } else {
        icon = await window.api.extractIcon(pathVal);
      }
    } else if (isUrl && !icon) {
      try {
        const domain = new URL(pathVal).hostname;
        icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch (e) {}
    }

    const finalEmoji = (selectedEmoji && selectedEmoji.trim()) ? selectedEmoji.trim() : null;

    const newApp = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: name,
      path: pathVal,
      category: assignedTab,
      isFolder: isFolder,
      isUrl: isUrl,
      icon: icon,
      emoji: finalEmoji,
      launchCount: 0
    };

    apps.push(newApp);
    await window.api.saveApps(apps);

    // Switch to the tab where the app was added
    currentTab = assignedTab;
    renderTabs();
    renderApps();

    // Reset inputs & close
    addNameInput.value = '';
    addPathInput.value = '';
    addPathInput.dataset.icon = '';
    addPathInput.dataset.isFolder = '';
    selectedEmoji = '';
    emojiPickerRow.querySelectorAll('.emoji-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));

    closeSettingsModal();
  });

  // Wallpaper Theme Presets
  wallpaperPresetsGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.theme-preset-card');
    if (!card) return;
    const theme = card.dataset.theme;
    applyTheme(theme);
    await window.api.saveSettings(settings);
  });

  // Custom Solid Color
  customSolidColorInput.addEventListener('input', (e) => {
    customSolidColorText.value = e.target.value;
    if (customSolidPreview) customSolidPreview.style.background = e.target.value;
  });

  customSolidColorText.addEventListener('input', (e) => {
    customSolidColorInput.value = e.target.value;
    if (customSolidPreview) customSolidPreview.style.background = e.target.value;
  });

  applySolidColorBtn.addEventListener('click', async () => {
    settings.customBgColor = customSolidColorInput.value;
    applyTheme('custom-solid');
    await window.api.saveSettings(settings);
  });

  // Custom 2-Color Gradient
  applyGradColorBtn.addEventListener('click', async () => {
    settings.gradStartColor = gradStartColorInput.value;
    settings.gradEndColor = gradEndColorInput.value;
    applyTheme('custom-gradient');
    await window.api.saveSettings(settings);
  });

  // Opacity Slider
  opacitySlider.addEventListener('input', async (e) => {
    const val = Number(e.target.value);
    opacityVal.textContent = `${val}%`;
    settings.opacity = val / 100;
    canvasBgLayer.style.opacity = settings.opacity;
    await window.api.saveSettings(settings);
  });

  // Create New Tab from Settings
  createNewTabBtn.addEventListener('click', async () => {
    const tabName = newTabInput.value.trim();
    if (!tabName) return;
    if (settings.tabs.map(t => t.toLowerCase()).includes(tabName.toLowerCase())) {
      alert('A tab with this name already exists.');
      return;
    }
    settings.tabs.push(tabName);
    currentTab = tabName;
    newTabInput.value = '';
    await window.api.saveSettings(settings);
    renderTabs();
    renderApps();
    updateAddTabDropdown();
    renderTabsManagerList();
  });

  // Quick Tab Modal
  closeQuickTabBtn.addEventListener('click', closeQuickTabModal);
  cancelQuickTabBtn.addEventListener('click', closeQuickTabModal);

  confirmQuickTabBtn.addEventListener('click', async () => {
    const tabName = quickTabInput.value.trim();
    if (!tabName) return;
    if (settings.tabs.map(t => t.toLowerCase()).includes(tabName.toLowerCase())) {
      alert('A tab with this name already exists.');
      return;
    }
    settings.tabs.push(tabName);
    currentTab = tabName;
    await window.api.saveSettings(settings);
    renderTabs();
    renderApps();
    updateAddTabDropdown();
    renderTabsManagerList();
    closeQuickTabModal();
  });

  quickTabInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      confirmQuickTabBtn.click();
    }
  });

  // Hotkey Presets Click
  hotkeyPresetBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const selectedKey = btn.dataset.key;
      const res = await window.api.setGlobalHotkey(selectedKey);
      if (res.success) {
        updateHotkeyDisplays(res.hotkey);
        showHotkeyFeedback(`Registered ${res.hotkey}`, 'success');
      } else {
        showHotkeyFeedback(res.error || 'Failed to register shortcut', 'error');
      }
    });
  });

  // Custom Hotkey Key Recorder
  customHotkeyInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const modifiers = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Super');

    let key = e.key;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return;

    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toUpperCase();

    const combo = [...modifiers, key].join('+');
    customHotkeyInput.value = combo;
  });

  saveCustomHotkeyBtn.addEventListener('click', async () => {
    const customKey = customHotkeyInput.value.trim();
    if (!customKey) {
      showHotkeyFeedback('Please press a key combination.', 'error');
      return;
    }
    const res = await window.api.setGlobalHotkey(customKey);
    if (res.success) {
      updateHotkeyDisplays(res.hotkey);
      showHotkeyFeedback(`Registered ${res.hotkey}`, 'success');
    } else {
      showHotkeyFeedback(res.error || 'Invalid or unavailable shortcut.', 'error');
    }
  });

  function showHotkeyFeedback(msg, type) {
    hotkeyFeedback.textContent = msg;
    hotkeyFeedback.className = `feedback-msg ${type}`;
    hotkeyFeedback.classList.remove('hidden');
    setTimeout(() => hotkeyFeedback.classList.add('hidden'), 3500);
  }

  // Auto Hide Setting
  autoHideCheckbox.addEventListener('change', async () => {
    settings.autoHideOnLaunch = autoHideCheckbox.checked;
    await window.api.saveSettings(settings);
  });

  // App Context Menu Actions
  ctxLaunch.addEventListener('click', () => {
    if (activeContextMenuApp) {
      triggerLaunch(activeContextMenuApp);
      hideAllContextMenus();
    }
  });

  ctxRunAdmin.addEventListener('click', () => {
    if (activeContextMenuApp) {
      window.api.launchApp(activeContextMenuApp.path, true);
      hideAllContextMenus();
    }
  });

  ctxOpenFolder.addEventListener('click', () => {
    if (activeContextMenuApp) {
      window.api.showInFolder(activeContextMenuApp.path);
      hideAllContextMenus();
    }
  });

  ctxMoveLeft.addEventListener('click', async () => {
    if (activeContextMenuApp) {
      const idx = apps.findIndex(a => a.id === activeContextMenuApp.id);
      if (idx > 0) {
        const temp = apps[idx];
        apps[idx] = apps[idx - 1];
        apps[idx - 1] = temp;
        await window.api.saveApps(apps);
        renderApps();
      }
      hideAllContextMenus();
    }
  });

  ctxMoveRight.addEventListener('click', async () => {
    if (activeContextMenuApp) {
      const idx = apps.findIndex(a => a.id === activeContextMenuApp.id);
      if (idx !== -1 && idx < apps.length - 1) {
        const temp = apps[idx];
        apps[idx] = apps[idx + 1];
        apps[idx + 1] = temp;
        await window.api.saveApps(apps);
        renderApps();
      }
      hideAllContextMenus();
    }
  });

  ctxRemove.addEventListener('click', async () => {
    if (activeContextMenuApp) {
      apps = apps.filter(a => a.id !== activeContextMenuApp.id);
      await window.api.saveApps(apps);
      renderApps();
      renderTabsManagerList();
      hideAllContextMenus();
    }
  });

  // Desktop Context Menu Actions
  ctxDeskSettings.addEventListener('click', () => {
    hideAllContextMenus();
    openSettingsModal('tabBackground');
  });

  ctxDeskAdd.addEventListener('click', () => {
    hideAllContextMenus();
    openSettingsModal('tabAdd');
  });

  ctxDeskNewTab.addEventListener('click', () => {
    hideAllContextMenus();
    openQuickTabModal();
  });

  ctxDeskExit.addEventListener('click', () => {
    hideAllContextMenus();
    window.api.hideWindow();
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!settingsModal.classList.contains('hidden')) {
        closeSettingsModal();
      } else if (!quickTabModal.classList.contains('hidden')) {
        closeQuickTabModal();
      } else if (!contextMenu.classList.contains('hidden') || !desktopContextMenu.classList.contains('hidden')) {
        hideAllContextMenus();
      } else if (searchQuery) {
        searchQuery = '';
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        renderApps();
      } else {
        window.api.hideWindow();
      }
      return;
    }

    if (e.key === 'Enter') {
      const firstCard = appsGrid.querySelector('.app-card');
      if (firstCard) {
        const appId = firstCard.dataset.id;
        const app = apps.find(a => a.id === appId);
        if (app) triggerLaunch(app, firstCard);
      }
      return;
    }

    // Direct typing sends focus to search input (just like macOS Launchpad)
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (!isTyping && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      searchInput.focus();
    }
  });

  // Drag-and-Drop files & folders from desktop (ONLY for external OS files)
  let dragCounter = 0;
  window.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.types || !e.dataTransfer.types.includes('Files')) {
      return;
    }
    e.preventDefault();
    dragCounter++;
    dropOverlay.classList.remove('hidden');
  });

  window.addEventListener('dragleave', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.types || !e.dataTransfer.types.includes('Files')) {
      return;
    }
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropOverlay.classList.add('hidden');
    }
  });

  window.addEventListener('dragover', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
    }
  });

  window.addEventListener('drop', async (e) => {
    dragCounter = 0;
    dropOverlay.classList.add('hidden');

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      const targetTab = currentTab !== 'all' ? currentTab : (settings.tabs[0] || 'Home');

      for (const file of e.dataTransfer.files) {
        const filePath = file.path;
        if (!filePath) continue;

        let name = file.name.replace(/\.[^/.]+$/, "");
        let icon = null;
        let isFolder = false;

        const info = await window.api.inspectPath(filePath);
        if (info) {
          isFolder = info.isFolder;
          icon = info.icon;
        } else {
          icon = await window.api.extractIcon(filePath);
        }

        const newApp = {
          id: 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          name: name,
          path: filePath,
          category: targetTab,
          isFolder: isFolder,
          icon: icon,
          launchCount: 0
        };

        apps.push(newApp);
      }

      await window.api.saveApps(apps);
      renderApps();
      renderTabsManagerList();
    }
  });
}

// Start Launchpad
init();
