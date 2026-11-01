const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell, globalShortcut, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec, execSync } = require('child_process');

let mainWindow = null;
let tray = null;
let currentGlobalHotkey = 'Alt+Space';

const USER_DATA_PATH = app.getPath('userData');
const APPS_FILE = path.join(USER_DATA_PATH, 'launchpad_apps.json');
const SETTINGS_FILE = path.join(USER_DATA_PATH, 'launchpad_settings.json');

// Default initial settings
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) {
          parsed.tabs = ['Home', 'Dev', 'Tools', 'Utilities'];
        }
        if (!parsed.bgTheme) {
          parsed.bgTheme = 'apple-vibrant';
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  return {
    autoHideOnLaunch: true,
    globalHotkey: 'Win+Space',
    opacity: 0.95,
    bgTheme: 'apple-vibrant',
    tabs: ['Home', 'Dev', 'Tools', 'Utilities']
  };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
}

// Helper to decode desktop.ini in Windows (supports UTF-8 and UTF-16LE with or without BOM)
function readDesktopIni(iniPath) {
  try {
    const buf = fs.readFileSync(iniPath);
    if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
      return buf.toString('utf16le');
    }
    if (buf.length >= 4 && buf[1] === 0x00 && buf[3] === 0x00) {
      return buf.toString('utf16le');
    }
    return buf.toString('utf8');
  } catch (e) {
    return '';
  }
}

// Generic Windows drive / volume icon signatures that must NEVER be treated as folder icons
function isGenericDriveIcon(iconDataUrl) {
  if (!iconDataUrl) return false;
  return iconDataUrl.includes('iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAADfUlEQVR4nOyYTW/TMBjHH3dN15c1') ||
         iconDataUrl.includes('AAADfUlEQVR4nOyYTW/TMBjHH3dN15c1axcNcQCRXuAz7LjL+iU4c+MDIHHniMSNM2c+wggHpLLTvgASrXhT2TrGKjZVqm2ex4kdJ0vWbSVbkfrfWqe2E') ||
         iconDataUrl.includes('iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rht');
}

// Extract customized .ico from desktop.ini or direct .ico files in folder
function extractCustomFolderIcon(folderPath) {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) return null;
    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) return null;

    // 1. Check desktop.ini inside the folder
    const iniPath = path.join(folderPath, 'desktop.ini');
    if (fs.existsSync(iniPath)) {
      // Try native Shell SHGetFileInfo first as Windows Shell automatically resolves desktop.ini icons
      try {
        const helperScript = path.join(__dirname, 'extract-icon-helper.ps1');
        if (fs.existsSync(helperScript)) {
          const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${helperScript}" -Path "${folderPath}"`, { timeout: 3500 }).toString().trim();
          const m = out.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
          if (m && !isGenericDriveIcon(m[0])) return m[0];
        }
      } catch (e) {}

      // Fallback manual parse of desktop.ini
      const iniText = readDesktopIni(iniPath);
      const match = iniText.match(/IconResource\s*=\s*([^\r\n]+)/i) || iniText.match(/IconFile\s*=\s*([^\r\n]+)/i);
      if (match && match[1]) {
        let rawTarget = match[1].trim();
        let iconIndex = 0;
        const commaIdx = rawTarget.lastIndexOf(',');
        if (commaIdx !== -1) {
          iconIndex = parseInt(rawTarget.slice(commaIdx + 1).trim(), 10) || 0;
          rawTarget = rawTarget.slice(0, commaIdx).trim();
        }
        rawTarget = rawTarget.replace(/^["']|["']$/g, '').trim();
        rawTarget = rawTarget.replace(/%([^%]+)%/g, (_, name) => process.env[name] || _);

        const resolved = path.isAbsolute(rawTarget) ? rawTarget : path.resolve(folderPath, rawTarget);
        if (fs.existsSync(resolved)) {
          const ext = path.extname(resolved).toLowerCase();
          if (ext === '.ico') {
            return 'data:image/x-icon;base64,' + fs.readFileSync(resolved).toString('base64');
          } else if (['.png', '.jpg', '.jpeg', '.bmp'].includes(ext)) {
            const mime = ext === '.ico' ? 'x-icon' : ext.replace('.', '');
            return `data:image/${mime};base64,` + fs.readFileSync(resolved).toString('base64');
          } else if (ext === '.dll' || ext === '.exe') {
            try {
              const helperScript = path.join(__dirname, 'extract-icon-helper.ps1');
              if (fs.existsSync(helperScript)) {
                const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${helperScript}" -DllFile "${resolved}" -Index ${iconIndex}`, { timeout: 3500 }).toString().trim();
                const m = out.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
                if (m && !isGenericDriveIcon(m[0])) return m[0];
              }
            } catch (err) {
              console.warn('Error extracting icon from DLL:', err.message);
            }
          }
        }
      }
    }

    // 2. Check for explicit common icon files in the folder root
    const commonNames = ['icon.ico', 'folder.ico', 'app.ico', 'logo.ico', 'favicon.ico'];
    for (const name of commonNames) {
      const candidate = path.join(folderPath, name);
      if (fs.existsSync(candidate)) {
        try {
          return 'data:image/x-icon;base64,' + fs.readFileSync(candidate).toString('base64');
        } catch (e) {}
      }
    }

    // 3. Check for any *.ico file in the folder root
    try {
      const entries = fs.readdirSync(folderPath);
      const icoName = entries.find(e => e.toLowerCase().endsWith('.ico'));
      if (icoName) {
        const fullIco = path.join(folderPath, icoName);
        return 'data:image/x-icon;base64,' + fs.readFileSync(fullIco).toString('base64');
      }
    } catch (e) {}
  } catch (err) {
    console.warn('Folder icon extraction warning:', err.message);
  }
  return null;
}

// Extract folder icon with custom .ico priority and native Shell fallback
async function extractFolderIconRobust(folderPath) {
  if (!folderPath) return null;

  // Priority 1: User's customized .ico or DLL icon from desktop.ini or folder root
  const customIco = extractCustomFolderIcon(folderPath);
  if (customIco && !isGenericDriveIcon(customIco)) return customIco;

  // Priority 2: Use Native Shell SHGetFileInfo via extract-icon-helper.ps1
  try {
    const helperScript = path.join(__dirname, 'extract-icon-helper.ps1');
    if (fs.existsSync(helperScript)) {
      const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${helperScript}" -Path "${folderPath}"`, { timeout: 3500 }).toString().trim();
      const m = out.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
      if (m && !isGenericDriveIcon(m[0])) return m[0];
    }
  } catch (e) {}

  // DO NOT use app.getFileIcon for folders as it returns the Windows OS drive icon!
  return null;
}

// Robust Icon Extraction with Windows Shortcut (.lnk) resolution & VisualElementsManifest
async function extractIconRobust(filePath) {
  if (!filePath) return null;

  let targetPath = filePath;
  let iconLocation = null;

  // Check if filePath is directly a directory
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        return await extractFolderIconRobust(filePath);
      }
    }
  } catch (e) {}

  // 1. If it's a .lnk shortcut, resolve the actual executable target and icon location via VBS
  if (filePath.toLowerCase().endsWith('.lnk')) {
    try {
      const safeEscaped = filePath.replace(/\\/g, '\\\\').replace(/"/g, '""');
      const vbsScript = `Set ws = CreateObject("WScript.Shell")\nSet sc = ws.CreateShortcut("${safeEscaped}")\nWScript.Echo sc.TargetPath\nWScript.Echo sc.IconLocation\n`;
      const tempVbs = path.join(app.getPath('temp'), `lnk_res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.vbs`);
      fs.writeFileSync(tempVbs, vbsScript, 'utf8');
      const output = execSync(`cscript //Nologo "${tempVbs}"`, { timeout: 2500 }).toString().trim().split(/\r?\n/);
      try { fs.unlinkSync(tempVbs); } catch (e) {}

      if (output[0] && fs.existsSync(output[0].trim())) {
        targetPath = output[0].trim();
      }
      if (output[1]) {
        iconLocation = output[1].split(',')[0].trim();
      }
    } catch (e) {
      console.warn('VBS LNK resolve error:', e.message);
    }
  }

  // 2. Check iconLocation first if it points directly to an .ico or .png file
  if (iconLocation && fs.existsSync(iconLocation) && (iconLocation.toLowerCase().endsWith('.ico') || iconLocation.toLowerCase().endsWith('.png'))) {
    try {
      const ext = path.extname(iconLocation).slice(1);
      return `data:image/${ext === 'ico' ? 'x-icon' : ext};base64,` + fs.readFileSync(iconLocation).toString('base64');
    } catch (e) {}
  }

  // 3. Check for VisualElementsManifest.xml (Antigravity IDE, VS Code, Edge, Chromium apps)
  try {
    const dir = path.dirname(targetPath);
    const baseName = path.basename(targetPath, path.extname(targetPath));
    const manifestCandidates = [
      path.join(dir, `${baseName}.VisualElementsManifest.xml`),
      path.join(dir, 'VisualElementsManifest.xml')
    ];

    for (const m of manifestCandidates) {
      if (fs.existsSync(m)) {
        const content = fs.readFileSync(m, 'utf8');
        // Must use word boundary \b so it doesn't match ShowNameOnSquare150x150Logo="on"!
        const match = content.match(/\bSquare150x150Logo="([^"]+)"/i) || content.match(/\bSquare70x70Logo="([^"]+)"/i);
        if (match && match[1] && match[1] !== 'on') {
          const logoPath = path.join(dir, match[1]);
          if (fs.existsSync(logoPath)) {
            const ext = path.extname(logoPath).slice(1) || 'png';
            return `data:image/${ext};base64,` + fs.readFileSync(logoPath).toString('base64');
          }
        }
      }
    }

    // Direct check for common resources/app/.../code_150x150.png
    const appLogo = path.join(dir, 'resources', 'app', 'resources', 'win32', 'code_150x150.png');
    if (fs.existsSync(appLogo)) {
      return 'data:image/png;base64,' + fs.readFileSync(appLogo).toString('base64');
    }
  } catch (e) {}

  // 4. Extract from the resolved target executable (.exe) using native getFileIcon
  try {
    if (fs.existsSync(targetPath)) {
      const nativeIcon = await app.getFileIcon(targetPath, { size: 'large' });
      if (nativeIcon && !nativeIcon.isEmpty()) {
        const dataUrl = nativeIcon.toDataURL();
        if (dataUrl && dataUrl.length > 50) {
          return dataUrl;
        }
      }
    }
  } catch (e) {}

  // 5. Fallback for original filePath if targetPath failed
  try {
    if (fs.existsSync(filePath) && filePath !== targetPath) {
      const nativeIcon = await app.getFileIcon(filePath, { size: 'large' });
      if (nativeIcon && !nativeIcon.isEmpty()) {
        return nativeIcon.toDataURL();
      }
    }
  } catch (e) {}

  return null;
}

// Build initial default apps if none exist
async function getDefaultApps() {
  const winDir = process.env.SystemRoot || 'C:\\Windows';
  const localAppData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const presets = [
    {
      id: 'explorer',
      name: 'File Explorer',
      path: path.join(winDir, 'explorer.exe'),
      category: 'Utilities',
      shortcutKey: 'E'
    },
    {
      id: 'notepad',
      name: 'Notepad',
      path: path.join(winDir, 'notepad.exe'),
      category: 'Tools',
      shortcutKey: 'N'
    },
    {
      id: 'calc',
      name: 'Calculator',
      path: path.join(winDir, 'System32', 'calc.exe'),
      category: 'Utilities',
      shortcutKey: 'C'
    },
    {
      id: 'taskmgr',
      name: 'Task Manager',
      path: path.join(winDir, 'System32', 'Taskmgr.exe'),
      category: 'Utilities',
      shortcutKey: 'T'
    },
    {
      id: 'powershell',
      name: 'PowerShell',
      path: path.join(winDir, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
      category: 'Dev',
      shortcutKey: 'P'
    },
    {
      id: 'cmd',
      name: 'Command Prompt',
      path: path.join(winDir, 'System32', 'cmd.exe'),
      category: 'Dev',
      shortcutKey: '1'
    },
    {
      id: 'edge',
      name: 'Microsoft Edge',
      path: path.join(progFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      category: 'Web',
      shortcutKey: '2'
    },
    {
      id: 'chrome',
      name: 'Google Chrome',
      path: path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      category: 'Web',
      shortcutKey: '3'
    },
    {
      id: 'vscode',
      name: 'VS Code',
      path: path.join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe'),
      category: 'Dev',
      shortcutKey: 'V'
    }
  ];

  const validApps = [];
  for (const item of presets) {
    if (fs.existsSync(item.path)) {
      const icon = await extractIconRobust(item.path);
      validApps.push({
        id: item.id,
        name: item.name,
        path: item.path,
        category: item.category,
        icon: icon,
        shortcutKey: item.shortcutKey || '',
        launchCount: 0
      });
    }
  }

  return validApps;
}

// The generic Windows blank document icon snippet to detect and replace
const GENERIC_BLANK_ICON_SNIPPET = 'iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACk0lEQVR4nOyYy2sTQRzHv/tIE4wxGxFpbNp40pPiRfAi4tEXxYMPJCAK3uOrPqAkIniO4NGzYhW8+Lr1qh5E/wBJrLFBCslGrNjs7owzm7du0t2ks/GQL1l2Z34zO598fzubycj4z6X2Cty8fiUvyfJObIAoIYXfBjmZy+U+wqOkXoFbN67RO3fvYSOUmb+NUCioV6qrh71CyvBJFy5e0mLR8GI6nd7npZ9vgJPxHQNB+gbINQikr4BcXiF9B+TyAjkSQC63kCMD5HIDqcIHaZpmvwv7NZmYUBbZOfZ3wBfAy1fn1m3DvoDmVD/SFLvRGHBYjQGH1RhwWI0Bh9UYcFippZVqhlKaliVJo81aSsGvVyqrzSLsmvqnHq9fYPOmICLhIESJLxay27dugaJInjubFkHxe1ksIHNvIDi7syLDMilESiXEeYADCyUUf5r1QiO1xKIMiCARVvDh/LQdIlQwIHUxgA3GDsJSSgiQLxutGOUVAtXTwben463rrz9MzD4voaBbdVij3YeINRAyof0d4HAnnpWYazU7tUaNsMNqxYlgB2XSx4IlBnf86TIKFQ6n4sWpKZhrFkyjDSX8GewFaMMtLOOLzuAiKl6emcJMVLXhOpkIEQ3o4ACHO/bkm+3cTCSA12cTNhwXtbrb++4ghzv6uMjgDAan4tW5NhxXMhZA564dJT6+ZpaqBo48Ys7DedS00hGu/+Z5ud2dZVFp7hrkjx4rzdmq4o3qcQ/cE4Sn+KOAVJ7Iij/MjF/aBuSWsDVDcRPko4B9k6G8HA27ukGwh1kKxK9ZpjaRMD7LshazQR/htfZd3ElvtHuVC+9+/Q5qyhKpjlZ7FNj/ee4DuzozH5FdFZ3/+D+3VkI0h8AAAD//4DeDdkAAAAGSURBVAMApABTzHcvZTAAAAAASUVORK5CYII=';

// Load persisted apps with automatic icon refresh for generic/broken icons
async function loadApps() {
  try {
    if (fs.existsSync(APPS_FILE)) {
      const data = JSON.parse(fs.readFileSync(APPS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        let updated = false;
        for (const a of data) {
          // Detect if it is a folder and refresh its custom .ico icon
          let isDir = a.isFolder;
          if (!isDir && a.path && fs.existsSync(a.path)) {
            try {
              isDir = fs.statSync(a.path).isDirectory();
              if (isDir) {
                a.isFolder = true;
                updated = true;
              }
            } catch (e) {}
          }

          if (isDir && a.path) {
            // Strip any erroneously stored generic Windows drive icons
            if (a.icon && isGenericDriveIcon(a.icon)) {
              a.icon = null;
              updated = true;
            }

            const customFolderIcon = await extractFolderIconRobust(a.path);
            if (customFolderIcon && !isGenericDriveIcon(customFolderIcon)) {
              if (a.icon !== customFolderIcon) {
                a.icon = customFolderIcon;
                updated = true;
              }
            }
          }

          // If icon is missing, or is the generic blank shortcut paper (< 1500 chars), or Antigravity
          const isGenericBlank = !a.icon || a.icon.length < 1500 || a.icon.includes(GENERIC_BLANK_ICON_SNIPPET) || a.name.includes('Antigravity');
          if (isGenericBlank && a.path && !a.isUrl) {
            const freshIcon = await extractIconRobust(a.path);
            if (freshIcon) {
              a.icon = freshIcon;
              updated = true;
            }
          }
        }
        if (updated) saveApps(data);
        return data;
      }
    }
  } catch (err) {
    console.error('Error loading apps:', err);
  }

  const defaults = await getDefaultApps();
  saveApps(defaults);
  return defaults;
}

function saveApps(apps) {
  try {
    fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving apps:', err);
    return false;
  }
}

// Scan Start Menu & PC Installed Applications (Fast Instant Index)
async function scanStartMenuShortcuts() {
  const dirs = [
    'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
    path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    'C:\\Users\\Public\\Desktop',
    path.join(process.env.USERPROFILE || '', 'Desktop')
  ];

  const foundShortcuts = [];
  const visitedNames = new Set();

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.toLowerCase().endsWith('.lnk')) {
          const appName = entry.name.replace(/\.lnk$/i, '');
          const lower = appName.toLowerCase();
          if (lower.includes('uninstall') || lower.includes('readme') || lower.includes('help') || lower.includes('documentation') || lower.includes('website')) {
            continue;
          }
          if (!visitedNames.has(lower)) {
            visitedNames.add(lower);
            foundShortcuts.push({
              name: appName,
              path: fullPath
            });
          }
        }
      }
    } catch (e) {}
  }

  for (const d of dirs) scanDir(d);

  // Scan %LOCALAPPDATA%\Programs (VS Code, Discord, Slack, Cursor, etc.)
  const localProgDir = path.join(process.env.LOCALAPPDATA || '', 'Programs');
  if (fs.existsSync(localProgDir)) {
    try {
      for (const d of fs.readdirSync(localProgDir, { withFileTypes: true })) {
        if (d.isDirectory()) {
          const subDir = path.join(localProgDir, d.name);
          for (const f of fs.readdirSync(subDir)) {
            if (f.toLowerCase().endsWith('.exe') && !f.toLowerCase().includes('update') && !f.toLowerCase().includes('uninstall')) {
              const appName = d.name;
              if (!visitedNames.has(appName.toLowerCase())) {
                visitedNames.add(appName.toLowerCase());
                foundShortcuts.push({
                  name: appName,
                  path: path.join(subDir, f)
                });
              }
              break;
            }
          }
        }
      }
    } catch (e) {}
  }

  // Windows Built-in Utilities
  const builtins = [
    { name: 'File Explorer', path: 'C:\\Windows\\explorer.exe' },
    { name: 'Notepad', path: 'C:\\Windows\\notepad.exe' },
    { name: 'Calculator', path: 'C:\\Windows\\System32\\calc.exe' },
    { name: 'Task Manager', path: 'C:\\Windows\\System32\\Taskmgr.exe' },
    { name: 'Command Prompt', path: 'C:\\Windows\\System32\\cmd.exe' },
    { name: 'PowerShell', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' },
    { name: 'Paint', path: 'C:\\Windows\\System32\\mspaint.exe' },
    { name: 'Snipping Tool', path: 'C:\\Windows\\System32\\SnippingTool.exe' }
  ];
  for (const b of builtins) {
    if (fs.existsSync(b.path) && !visitedNames.has(b.name.toLowerCase())) {
      visitedNames.add(b.name.toLowerCase());
      foundShortcuts.push(b);
    }
  }

  foundShortcuts.sort((a, b) => a.name.localeCompare(b.name));

  return foundShortcuts.map((item, idx) => ({
    id: 'scanned_' + idx + '_' + Buffer.from(item.name).toString('hex').slice(0, 8),
    name: item.name,
    path: item.path
  }));
}

// Window Management
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    fullscreen: true,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: false,
    show: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('FAILED TO LOAD:', code, desc);
  });
  mainWindow.webContents.on('console-message', (e, level, msg, line, src) => {
    console.log('CONSOLE:', msg, 'at line', line);
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('window-shown');
  });

  // Guarantee window is brought to front on start
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(true);
      mainWindow.show();
      mainWindow.focus();
    }
  }, 250);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('window-shown');
  }
}

function applyGlobalHotkey(newHotkey) {
  try {
    globalShortcut.unregisterAll();

    const cleanKey = (newHotkey || 'Win+Space').trim();
    const isWin = cleanKey.toLowerCase().includes('win');

    if (isWin) {
      currentGlobalHotkey = 'Win+Space';
      try { globalShortcut.register('F4', () => toggleWindow()); } catch (e) {}
      const settings = loadSettings();
      settings.globalHotkey = 'Win+Space';
      saveSettings(settings);
      if (tray) tray.setToolTip('Launchpad (Win+Space or F4)');
      console.log('Global shortcut configured: Win+Space (and fallback F4)');
      return { success: true, hotkey: 'Win+Space' };
    }

    const success = globalShortcut.register(cleanKey, () => {
      toggleWindow();
    });

    if (success) {
      currentGlobalHotkey = cleanKey;
      if (cleanKey !== 'F4') {
        try { globalShortcut.register('F4', () => toggleWindow()); } catch (e) {}
      }
      const settings = loadSettings();
      settings.globalHotkey = cleanKey;
      saveSettings(settings);
      if (tray) tray.setToolTip(`Launchpad (${cleanKey} or F4)`);
      console.log('Global shortcut registered successfully:', cleanKey);
      return { success: true, hotkey: cleanKey };
    } else {
      console.warn('Failed to register shortcut with Electron:', cleanKey);
      // Restore previous hotkey
      if (currentGlobalHotkey && currentGlobalHotkey !== cleanKey) {
        applyGlobalHotkey(currentGlobalHotkey);
      }
      return { success: false, error: `"${cleanKey}" is reserved by Windows or another application` };
    }
  } catch (err) {
    console.warn('Error applying hotkey:', err.message);
    return { success: false, error: err.message };
  }
}

function registerGlobalHotkey(hotkey) {
  return applyGlobalHotkey(hotkey).success;
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    let trayIcon = nativeImage.createFromPath(iconPath);
    if (!trayIcon.isEmpty()) {
      trayIcon = trayIcon.resize({ width: 20, height: 20 });
    }
    tray = new Tray(trayIcon);

    tray.setToolTip(`Launchpad (${currentGlobalHotkey} or F4)`);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🚀 Open Fullscreen Launchpad',
        click: () => {
          if (!mainWindow) createWindow();
          else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: '❌ Quit Launchpad',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      toggleWindow();
    });
  } catch (err) {
    console.warn('Tray creation skipped:', err.message);
  }
}

// IPC Handlers
ipcMain.handle('get-apps', async () => {
  return await loadApps();
});

ipcMain.handle('save-apps', async (event, apps) => {
  return saveApps(apps);
});

ipcMain.handle('extract-icon', async (event, filePath) => {
  return await extractIconRobust(filePath);
});

ipcMain.handle('get-global-hotkey', () => {
  const settings = loadSettings();
  return settings.globalHotkey || currentGlobalHotkey;
});

ipcMain.handle('set-global-hotkey', (event, newHotkey) => {
  if (!newHotkey) return { success: false, error: 'Empty shortcut' };
  return applyGlobalHotkey(newHotkey);
});

ipcMain.handle('browse-app', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Application or Shortcut for Launchpad',
    properties: ['openFile'],
    filters: [
      { name: 'Applications & Shortcuts', extensions: ['exe', 'lnk', 'bat', 'cmd', 'url'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    const baseName = path.basename(selectedPath, path.extname(selectedPath));
    const icon = await extractIconRobust(selectedPath);

    return {
      name: baseName,
      path: selectedPath,
      icon: icon
    };
  }
  return null;
});

ipcMain.handle('browse-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Folder for Launchpad',
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    const baseName = path.basename(selectedPath);
    const icon = await extractFolderIconRobust(selectedPath);

    return {
      name: baseName,
      path: selectedPath,
      isFolder: true,
      icon: icon
    };
  }
  return null;
});

ipcMain.handle('inspect-path', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    const stat = fs.statSync(filePath);
    const isFolder = stat.isDirectory();
    const icon = await extractIconRobust(filePath);
    return {
      isFolder,
      icon
    };
  } catch (e) {
    return null;
  }
});

ipcMain.handle('scan-installed-apps', async () => {
  return await scanStartMenuShortcuts();
});

ipcMain.handle('launch-app', async (event, { target, runAsAdmin }) => {
  try {
    if (!target) return { success: false, error: 'Empty target' };

    const settings = loadSettings();

    if (target.startsWith('http://') || target.startsWith('https://')) {
      await shell.openExternal(target);
    } else if (runAsAdmin) {
      const psCommand = `Start-Process -FilePath "${target}" -Verb RunAs`;
      exec(`powershell -NoProfile -Command "${psCommand}"`, (error) => {
        if (error) console.error('Admin launch error:', error);
      });
    } else {
      const res = await shell.openPath(target);
      if (res) {
        console.warn('shell.openPath issue, falling back to spawn:', res);
        spawn(target, [], { detached: true, stdio: 'ignore', shell: true }).unref();
      }
    }

    if (mainWindow && settings.autoHideOnLaunch !== false) {
      setTimeout(() => {
        if (mainWindow) mainWindow.hide();
      }, 150);
    }

    return { success: true };
  } catch (err) {
    console.error('Launch failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('show-in-folder', async (event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('get-settings', () => {
  return loadSettings();
});

ipcMain.handle('save-settings', (event, settings) => {
  return saveSettings(settings);
});

let hookProcess = null;

function startWinSpaceHook() {
  try {
    const hookScript = path.join(__dirname, 'win-space-hook.ps1');
    if (!fs.existsSync(hookScript)) return;

    hookProcess = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass',
      '-File', hookScript
    ], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore']
    });

    hookProcess.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('TOGGLE')) {
        const activeKey = (currentGlobalHotkey || '').toLowerCase();
        if (activeKey.includes('win')) {
          toggleWindow();
        }
      }
    });

    hookProcess.on('error', (err) => {
      console.warn('Win+Space hook error:', err.message);
    });
  } catch (err) {
    console.warn('Failed to start Win+Space hook:', err.message);
  }
}

function stopWinSpaceHook() {
  if (hookProcess) {
    try {
      hookProcess.kill();
    } catch (e) {}
    hookProcess = null;
  }
}

// App Lifecycle
app.whenReady().then(async () => {
  const settings = loadSettings();
  currentGlobalHotkey = settings.globalHotkey || 'Win+Space';

  createTray();
  applyGlobalHotkey(currentGlobalHotkey);
  startWinSpaceHook();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  stopWinSpaceHook();
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && app.isQuitting) {
    app.quit();
  }
});
