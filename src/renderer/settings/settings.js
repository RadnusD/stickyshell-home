// StickyShell Home Edition - Settings Controller
// Clean, focused settings without developer mode switchers or license boxes.

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Preferences Elements
  const chkGlobalHotkeys = document.getElementById('chk-global-hotkeys');
  const chkConfirmDelete = document.getElementById('chk-confirm-delete');

  // Default Run Options Elements
  const selDefaultRunMode = document.getElementById('sel-default-run-mode');
  const selDefaultTerminal = document.getElementById('sel-default-terminal');
  const lblDefaultFolder = document.getElementById('lbl-default-folder');
  const btnBrowseDefaultFolder = document.getElementById('btn-browse-default-folder');
  const btnResetDefaultFolder = document.getElementById('btn-reset-default-folder');

  let currentDefaultFolder = null;
  let systemDefaultDir = '';

  // About OS Element
  const aboutOs = document.getElementById('about-os');

  // Switch Tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  function updateDefaultFolderUI() {
    if (!lblDefaultFolder) return;
    if (currentDefaultFolder) {
      lblDefaultFolder.textContent = currentDefaultFolder;
      lblDefaultFolder.title = currentDefaultFolder;
      if (btnResetDefaultFolder) btnResetDefaultFolder.classList.remove('hidden');
    } else {
      const display = systemDefaultDir ? `Default (${systemDefaultDir})` : 'Default (User Profile Home)';
      lblDefaultFolder.textContent = display;
      lblDefaultFolder.title = systemDefaultDir || 'Default User Home Directory';
      if (btnResetDefaultFolder) btnResetDefaultFolder.classList.add('hidden');
    }
  }

  // Save Preferences on change
  const savePrefs = async () => {
    try {
      await window.stickyShellAPI.saveSettings({
        globalHotkeysEnabled: chkGlobalHotkeys ? chkGlobalHotkeys.checked : true,
        confirmDelete: chkConfirmDelete ? chkConfirmDelete.checked : false,
        defaultRunMode: selDefaultRunMode ? selDefaultRunMode.value : 'capture',
        defaultTerminal: selDefaultTerminal ? selDefaultTerminal.value : 'cmd',
        defaultFolder: currentDefaultFolder || null
      });
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  // Populate Default Terminal Shell Dropdown (Built-in shells for Home Edition)
  async function loadDefaultTerminalsDropdown(targetVal) {
    if (!selDefaultTerminal) return;
    try {
      const allTerminals = await window.stickyShellAPI.getAvailableTerminals();
      if (!allTerminals || allTerminals.length === 0) return;

      // Filter to built-in terminals for Home Edition
      const terminals = allTerminals.filter(t => !t.isCustom && t.type !== 'custom' && t.term_type !== 'custom' && (!t.id || !t.id.startsWith('custom-')));
      if (terminals.length === 0) return;

      const currentSelected = targetVal !== undefined ? targetVal : selDefaultTerminal.value;
      selDefaultTerminal.innerHTML = '';
      terminals.forEach(term => {
        const opt = document.createElement('option');
        opt.value = term.id;
        opt.textContent = term.name;
        selDefaultTerminal.appendChild(opt);
      });

      const exists = terminals.some(t => t.id === currentSelected);
      if (exists) {
        selDefaultTerminal.value = currentSelected;
      } else {
        const fallback = terminals.find(t => t.id === 'cmd') || terminals[0];
        selDefaultTerminal.value = fallback.id;
        await savePrefs();
      }
    } catch (e) {
      console.error('Error loading terminals for default select:', e);
    }
  }

  // Load General Preferences
  async function loadPreferences() {
    try {
      try {
        if (window.stickyShellAPI.getDefaultDirectory) {
          systemDefaultDir = await window.stickyShellAPI.getDefaultDirectory();
        }
      } catch (_) {}

      const settings = await window.stickyShellAPI.getSettings();
      if (settings) {
        if (chkGlobalHotkeys) chkGlobalHotkeys.checked = !!settings.globalHotkeysEnabled;
        if (chkConfirmDelete) chkConfirmDelete.checked = !!settings.confirmDelete;
        if (selDefaultRunMode) selDefaultRunMode.value = settings.defaultRunMode || 'capture';
        currentDefaultFolder = settings.defaultFolder || null;
        updateDefaultFolderUI();
      }

      await loadDefaultTerminalsDropdown(settings ? settings.defaultTerminal : undefined);
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  }

  if (chkGlobalHotkeys) chkGlobalHotkeys.addEventListener('change', savePrefs);
  if (chkConfirmDelete) chkConfirmDelete.addEventListener('change', savePrefs);
  if (selDefaultRunMode) selDefaultRunMode.addEventListener('change', savePrefs);
  if (selDefaultTerminal) selDefaultTerminal.addEventListener('change', savePrefs);

  if (btnBrowseDefaultFolder) {
    btnBrowseDefaultFolder.addEventListener('click', async () => {
      try {
        const folder = await window.stickyShellAPI.pickFolder();
        if (folder) {
          currentDefaultFolder = folder;
          updateDefaultFolderUI();
          await savePrefs();
        }
      } catch (err) {
        console.error('Pick folder error:', err);
      }
    });
  }

  if (btnResetDefaultFolder) {
    btnResetDefaultFolder.addEventListener('click', async () => {
      currentDefaultFolder = null;
      updateDefaultFolderUI();
      await savePrefs();
    });
  }

  // Toast Notification Helper
  const toastEl = document.getElementById('settings-toast');
  let toastTimer = null;
  function showToast(msg, duration = 3000) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.classList.add('hidden'), 200);
    }, duration);
  }

  // OS Info & External Links
  if (aboutOs) {
    try {
      const plat = window.stickyShellAPI.getPlatform();
      aboutOs.textContent = plat === 'win32' ? 'Microsoft Windows' : plat;
    } catch (e) {
      aboutOs.textContent = 'Windows';
    }
  }

  const linkGithubRepo = document.getElementById('link-github-repo');
  if (linkGithubRepo) {
    linkGithubRepo.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.stickyShellAPI && window.stickyShellAPI.openExternalUrl) {
        window.stickyShellAPI.openExternalUrl('https://github.com/RadnusD/stickyshell-home');
      }
    });
  }

  // Feedback & Support Elements
  const btnReportGithubBug = document.getElementById('btn-report-github-bug');
  const btnReportGithubFeature = document.getElementById('btn-report-github-feature');
  const btnCopyDiagnostics = document.getElementById('btn-copy-diagnostics');

  // 1. Report Bug on GitHub (Pre-filled template)
  if (btnReportGithubBug) {
    btnReportGithubBug.addEventListener('click', async () => {
      try {
        let diag = '';
        if (window.stickyShellAPI && window.stickyShellAPI.getSystemDiagnostics) {
          diag = await window.stickyShellAPI.getSystemDiagnostics();
        }
        const title = encodeURIComponent('[Bug]: ');
        const body = encodeURIComponent(
          `## Problem Description\n<!-- Describe what happened -->\n\n` +
          `## Steps to Reproduce\n1. \n2. \n3. \n\n` +
          `## Expected Behavior\n<!-- What did you expect to happen? -->\n\n` +
          `## Diagnostics\n${diag}`
        );
        const url = `https://github.com/RadnusD/stickyshell-home/issues/new?title=${title}&body=${body}`;
        if (window.stickyShellAPI && window.stickyShellAPI.openExternalUrl) {
          await window.stickyShellAPI.openExternalUrl(url);
        }
      } catch (err) {
        console.error('Open GitHub bug error:', err);
      }
    });
  }

  // 2. Request Feature on GitHub
  if (btnReportGithubFeature) {
    btnReportGithubFeature.addEventListener('click', async () => {
      try {
        const title = encodeURIComponent('[Feature]: ');
        const body = encodeURIComponent(
          `## Feature Proposal\n<!-- What new capability or workflow would you like to see? -->\n\n` +
          `## Why is this needed?\n<!-- Describe the use-case -->\n`
        );
        const url = `https://github.com/RadnusD/stickyshell-home/issues/new?title=${title}&body=${body}`;
        if (window.stickyShellAPI && window.stickyShellAPI.openExternalUrl) {
          await window.stickyShellAPI.openExternalUrl(url);
        }
      } catch (err) {
        console.error('Open GitHub feature error:', err);
      }
    });
  }

  // 5. Copy System Diagnostics
  if (btnCopyDiagnostics) {
    btnCopyDiagnostics.addEventListener('click', async () => {
      try {
        let diag = '';
        if (window.stickyShellAPI && window.stickyShellAPI.getSystemDiagnostics) {
          diag = await window.stickyShellAPI.getSystemDiagnostics();
        } else {
          diag = `### StickyShell Diagnostics\n- OS: ${navigator.userAgent}\n- App: StickyShell Home v1.1.0`;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(diag);
        } else {
          // Fallback textarea copy
          const temp = document.createElement('textarea');
          temp.value = diag;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }

        showToast('📋 Diagnostics copied to clipboard!');
      } catch (err) {
        console.error('Copy diagnostics error:', err);
        showToast('❌ Failed to copy diagnostics.');
      }
    });
  }

  // Real-time synchronization
  if (window.stickyShellAPI && window.stickyShellAPI.onTerminalsChanged) {
    window.stickyShellAPI.onTerminalsChanged(async () => {
      await loadDefaultTerminalsDropdown();
    });
  }

  // Initialize
  await loadPreferences();
});
