// StickyShell Home Edition IPC Bridge
// Maps window.stickyShellAPI and window.api to native Tauri v2 IPC commands

(function () {
  const isTauri = typeof window !== 'undefined' && !!(window.__TAURI__ || window.__TAURI_INTERNALS__);

  let invoke = null;
  if (isTauri) {
    if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
      invoke = window.__TAURI__.core.invoke.bind(window.__TAURI__.core);
    } else if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
      invoke = window.__TAURI_INTERNALS__.invoke.bind(window.__TAURI_INTERNALS__);
    } else if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
      invoke = window.__TAURI__.invoke.bind(window.__TAURI__);
    }
  }

  const safeListen = (eventName, callback) => {
    try {
      if (window.__TAURI__ && window.__TAURI__.event && typeof window.__TAURI__.event.listen === 'function') {
        return window.__TAURI__.event.listen(eventName, callback);
      }
      if (window.__TAURI_EVENT_PLUGIN_INTERNALS__ && typeof window.__TAURI_EVENT_PLUGIN_INTERNALS__.listen === 'function') {
        return window.__TAURI_EVENT_PLUGIN_INTERNALS__.listen(eventName, callback);
      }
      if (invoke && window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.transformCallback === 'function') {
        const handler = window.__TAURI_INTERNALS__.transformCallback((raw) => {
          callback(raw);
        });
        return invoke('plugin:event|listen', {
          event: eventName,
          target: { kind: 'Any' },
          handler: handler
        });
      }
    } catch (err) {
      console.warn('Failed to register listen for event:', eventName, err);
    }
    return Promise.resolve(() => {});
  };

  let apiImpl;

  if (invoke) {
    const listen = safeListen;

    apiImpl = {
      // Notes & Windows
      getCurrentNoteId: () => invoke('get_current_note_id'),
      getNote: (id) => invoke('get_note', { id: id || '' }),
      saveNote: (note) => invoke('save_note', {
        note: {
          id: note.id || '',
          title: note.title || '',
          content: note.content || '',
          terminal: note.terminal || note.terminalId || 'cmd',
          customFolder: note.cwd || note.customFolder || null,
          runMode: note.runMode || null,
          x: note.x || null,
          y: note.y || null,
          width: note.width || null,
          height: note.height || null,
          isPinned: !!note.isPinned,
          theme: 'classic-yellow',
          opacity: 100.0,
          createdAt: note.createdAt || null,
          updatedAt: note.updatedAt || null
        }
      }),
      deleteNote: (id) => invoke('delete_note', { id: id || '' }),
      confirmAndDeleteNote: (id) => invoke('delete_note', { id: id || '' }),
      undoDelete: () => invoke('undo_delete'),
      createNewNote: () => invoke('create_new_note'),
      newNote: () => invoke('create_new_note'),
      closeWindow: (id) => invoke('close_note_window', { id: id || '' }),
      closeNote: (id) => invoke('close_note_window', { id: id || '' }),
      openSettings: () => invoke('open_settings_window'),
      openRunFolder: (id) => invoke('pick_folder'),
      togglePin: (isPinned) => invoke('set_always_on_top', { isPinned: !!isPinned }),
      setAlwaysOnTop: (isPinned) => invoke('set_always_on_top', { isPinned: !!isPinned }),

      // Terminals & Execution
      getAvailableTerminals: () => invoke('get_available_terminals'),
      runTerminal: (options) => invoke('run_in_terminal', {
        options: {
          terminalId: (options && (options.terminalId || options.terminal)) || 'cmd',
          command: (options && options.command) || '',
          customFolder: (options && (options.customFolder || options.cwd)) || null
        }
      }),
      runInTerminal: (options) => invoke('run_in_terminal', {
        options: {
          terminalId: (options && (options.terminalId || options.terminal)) || 'cmd',
          command: (options && options.command) || '',
          customFolder: (options && (options.customFolder || options.cwd)) || null
        }
      }),
      executeAndCapture: (options) => invoke('execute_and_capture', {
        options: {
          terminalId: (options && (options.terminalId || options.terminal)) || 'cmd',
          command: (options && options.command) || '',
          customFolder: (options && (options.customFolder || options.cwd)) || null
        }
      }),
      executeStreaming: (options) => invoke('execute_streaming', {
        options: {
          terminalId: (options && (options.terminalId || options.terminal)) || 'cmd',
          command: (options && options.command) || '',
          customFolder: (options && (options.customFolder || options.cwd)) || null
        }
      }),
      onCommandOutputChunk: (callback) => listen('command-output-chunk', callback),
      onCommandFinished: (callback) => listen('command-output-finished', callback),
      pickFolder: () => invoke('pick_folder'),
      getDefaultDirectory: () => invoke('get_default_working_directory'),

      // Settings & Preferences
      getSettings: () => invoke('get_settings'),
      saveSettings: (settings) => invoke('save_settings', { settings }),
      addCustomTerminal: (terminal) => invoke('add_custom_terminal', {
        terminal: {
          id: terminal.id || '',
          name: terminal.name || '',
          command: terminal.exePath || terminal.command || '',
          args: terminal.args || null,
          isCustom: true
        }
      }),
      removeCustomTerminal: (id) => invoke('remove_custom_terminal', { id }),
      pickTerminalExe: () => invoke('pick_terminal_exe'),
      getPlatform: () => {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('win')) return 'win32';
        if (ua.includes('mac')) return 'darwin';
        return 'linux';
      },
      exitApp: () => invoke('exit_app'),

      // Edition
      getEditionStatus: () => invoke('get_edition_status'),

      // Window resizing
      setWindowSize: (opts) => {
        const width = (opts && typeof opts.width === 'number') ? opts.width : 270;
        const height = (opts && typeof opts.height === 'number') ? opts.height : 220;
        return invoke('resize_note_window', { width, height });
      },

      // External Links & Diagnostics
      openExternalUrl: (url) => invoke('open_external_url', { url: url || '' }),
      getSystemDiagnostics: () => invoke('get_system_diagnostics'),

      // Event Listeners
      onNoteLoaded: (callback) => {
        listen('note-loaded', (event) => callback(event.payload));
      },
      onTerminalsChanged: (callback) => {
        return listen('terminals-changed', (event) => callback(event ? event.payload : null));
      }
    };
  } else {
    // Browser fallback (pure Home)
    apiImpl = {
      getCurrentNoteId: async () => 'mock-home-note',
      getNote: async () => ({
        id: 'mock-home-note',
        title: '',
        content: 'echo "Welcome to StickyShell Home Edition"',
        terminal: 'cmd',
        customFolder: null,
        runMode: 'capture',
        isPinned: false,
        theme: 'classic-yellow',
        opacity: 100.0
      }),
      saveNote: async (note) => note,
      deleteNote: async () => true,
      confirmAndDeleteNote: async () => true,
      undoDelete: async () => null,
      createNewNote: async () => 'mock-home-note-' + Date.now(),
      newNote: async () => 'mock-home-note-' + Date.now(),
      closeWindow: async () => {},
      closeNote: async () => {},
      openSettings: async () => {},
      openRunFolder: async () => null,
      togglePin: async () => true,
      setAlwaysOnTop: async () => true,
      getAvailableTerminals: async () => [
        { id: 'cmd', name: 'Command Prompt (cmd.exe)' },
        { id: 'powershell', name: 'PowerShell' }
      ],
      runTerminal: async () => {},
      runInTerminal: async () => {},
      executeAndCapture: async (opts) => ({
        stdout: `Executed in Home: ${opts && opts.command}`,
        stderr: '',
        exitCode: 0
      }),
      executeStreaming: async (opts) => ({
        stdout: `Executed in Home: ${opts && opts.command}`,
        stderr: '',
        exitCode: 0
      }),
      onCommandOutputChunk: () => () => {},
      onCommandFinished: () => () => {},
      pickFolder: async () => null,
      getDefaultDirectory: async () => 'C:\\Users\\Default',
      getSettings: async () => ({
        edition: 'home',
        activeTheme: 'classic-yellow',
        defaultTerminal: 'cmd',
        defaultRunMode: 'capture',
        defaultFolder: null,
        confirmDelete: false,
        globalHotkeysEnabled: true
      }),
      saveSettings: async (s) => s,
      addCustomTerminal: async (t) => t,
      removeCustomTerminal: async () => true,
      pickTerminalExe: async () => null,
      getPlatform: () => 'win32',
      exitApp: async () => {},
      getEditionStatus: async () => ({
        edition: 'home',
        isPro: false,
        hasLicenseKey: false,
        safetyGuardEnabled: false,
        secretMaskingEnabled: false
      }),
      setWindowSize: async () => {},
      openExternalUrl: async (url) => { if (typeof window !== 'undefined' && url) window.open(url, '_blank'); },
      getSystemDiagnostics: async () => `### StickyShell Diagnostics Report (Mock)\n- OS: Browser Environment\n- Version: 1.1.0`,
      onNoteLoaded: () => {},
      onTerminalsChanged: () => () => {}
    };
  }

  // Production Security & Anti-Inspection Guard
  if (typeof window !== 'undefined') {
    document.addEventListener('contextmenu', function (e) {
      var tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
      if (tag !== 'TEXTAREA' && tag !== 'INPUT') {
        e.preventDefault();
        return false;
      }
    }, false);

    document.addEventListener('keydown', function (e) {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) ||
        (e.metaKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  window.stickyShellAPI = apiImpl;
  window.api = apiImpl;
})();
