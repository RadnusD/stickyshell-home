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
        window.stickyShellAPI.openExternalUrl('https://github.com/RadnusD');
      }
    });
  }

  // Feedback & Error Reporting Elements
  const txtErrorFeedback = document.getElementById('txt-error-feedback');
  const btnSendTelegramReport = document.getElementById('btn-send-telegram-report');
  const telegramReportStatus = document.getElementById('telegram-report-status');
  const btnReportGithubBug = document.getElementById('btn-report-github-bug');
  const btnReportGithubFeature = document.getElementById('btn-report-github-feature');
  const btnOpenTelegramChat = document.getElementById('btn-open-telegram-chat');
  const btnCopyDiagnostics = document.getElementById('btn-copy-diagnostics');

  // Telegram Bot Credentials
  const TELEGRAM_BOT_TOKEN = '8637357894:AAGZJ9ZXqdN-ZFfDH-5nk0kW-Q7dkwMO1xI';
  const TELEGRAM_CHAT_ID = '1187606479';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 1. Send Instant Telegram Error Report
  if (btnSendTelegramReport) {
    btnSendTelegramReport.addEventListener('click', async () => {
      const userMessage = txtErrorFeedback ? txtErrorFeedback.value.trim() : '';
      const originalText = btnSendTelegramReport.innerHTML;
      btnSendTelegramReport.disabled = true;
      btnSendTelegramReport.innerHTML = '<span class="btn-text">⏳ Sending...</span>';
      if (telegramReportStatus) telegramReportStatus.textContent = '';

      try {
        let diag = '';
        if (window.stickyShellAPI && window.stickyShellAPI.getSystemDiagnostics) {
          diag = await window.stickyShellAPI.getSystemDiagnostics();
        } else {
          diag = `OS: ${navigator.userAgent}\nApp: StickyShell Home v1.0.0`;
        }

        // Notify local Rust logging backend
        if (window.stickyShellAPI && window.stickyShellAPI.sendTelegramReport) {
          window.stickyShellAPI.sendTelegramReport(diag, userMessage).catch(() => {});
        }

        // Format HTML Telegram message
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        const htmlMessage =
          `<b>🚨 StickyShell Issue Report</b>\n\n` +
          `<b>📱 App:</b> StickyShell Home v1.0.0\n` +
          `<b>⏰ Time:</b> ${escapeHtml(now)}\n\n` +
          (userMessage ? `<b>📝 User Note:</b>\n${escapeHtml(userMessage)}\n\n` : '') +
          `<b>🔍 System Diagnostics:</b>\n<pre>${escapeHtml(diag)}</pre>`;

        // Direct dispatch to Telegram Bot API
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: htmlMessage,
            parse_mode: 'HTML'
          })
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.description || `HTTP ${response.status}`);
        }

        if (telegramReportStatus) {
          telegramReportStatus.textContent = '✅ Sent to developer Telegram!';
          telegramReportStatus.style.color = '#15803d';
        }
        showToast('✅ Report dispatched to developer Telegram!');
        if (txtErrorFeedback) txtErrorFeedback.value = '';
      } catch (err) {
        console.error('Failed to send telegram report:', err);
        if (telegramReportStatus) {
          telegramReportStatus.textContent = '⚠️ Could not send: ' + (err.message || 'Network error');
          telegramReportStatus.style.color = '#b45309';
        }
        showToast('⚠️ Could not send report. Please check internet connection.');
      } finally {
        btnSendTelegramReport.disabled = false;
        btnSendTelegramReport.innerHTML = originalText;
      }
    });
  }

  // 2. Report Bug on GitHub (Pre-filled template)
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

  // 3. Request Feature on GitHub
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

  // 4. Telegram Bot Direct Link
  if (btnOpenTelegramChat) {
    btnOpenTelegramChat.addEventListener('click', async () => {
      try {
        const url = 'https://t.me/my_stickyshell_reports_bot';
        if (window.stickyShellAPI && window.stickyShellAPI.openExternalUrl) {
          await window.stickyShellAPI.openExternalUrl(url);
        }
      } catch (err) {
        console.error('Open Telegram bot error:', err);
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
          diag = `### StickyShell Diagnostics\n- OS: ${navigator.userAgent}\n- App: StickyShell Home v1.0.0`;
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
