// StickyShell Home Edition - Note Controller
// Clean, fast note editor with native shell execution.
// Contains zero developer/pro evaluation code.

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const appContainer = document.getElementById('app-container');
  const stickyHeader = document.getElementById('sticky-header');
  const noteEditorArea = document.getElementById('note-editor-area');
  const noteTextarea = document.getElementById('note-textarea');
  const stickyBody = document.getElementById('sticky-body');

  // Header Buttons
  const btnNewNote = document.getElementById('btn-new-note');
  const btnPin = document.getElementById('btn-pin');
  const btnDelete = document.getElementById('btn-delete');
  const btnMenu = document.getElementById('btn-menu');
  const btnClose = document.getElementById('btn-close');

  // Context Menu
  const dropdownMenu = document.getElementById('dropdown-menu');
  const menuRun = document.getElementById('menu-run');
  const menuRunOpts = document.getElementById('menu-run-opts');
  const menuNewNote = document.getElementById('menu-new-note');
  const menuPin = document.getElementById('menu-pin');
  const menuPinText = document.getElementById('menu-pin-text');
  const menuUndoDelete = document.getElementById('menu-undo-delete');
  const menuSettings = document.getElementById('menu-settings');
  const menuDelete = document.getElementById('menu-delete');
  const menuCloseWindow = document.getElementById('menu-close-window');
  const menuExit = document.getElementById('menu-exit');
  const menuTogglePreview = document.getElementById('menu-toggle-preview');
  const menuPreviewText = document.getElementById('menu-preview-text');

  // Run Options Flyout
  const runOptionsFlyout = document.getElementById('run-options-flyout');
  const btnFlyoutBack = document.getElementById('btn-flyout-back');
  const radioModeExternal = document.getElementById('radio-mode-external');
  const radioModeCapture = document.getElementById('radio-mode-capture');
  const flyoutTerminalList = document.getElementById('flyout-terminal-list');
  const btnSelectFolder = document.getElementById('btn-select-folder');
  const folderPathDisplay = document.getElementById('folder-path-display');
  const btnClearFolder = document.getElementById('btn-clear-folder');

  // Output Pane
  const outputWrapper = document.getElementById('output-wrapper');
  const outputScrollPane = document.getElementById('output-scroll-pane');
  const outputStatusPill = document.getElementById('output-status-pill');
  const noteOutputPre = document.getElementById('note-output-pre');
  const btnCopyOutput = document.getElementById('btn-copy-output');
  const btnCloseOutput = document.getElementById('btn-close-output');

  // Note Preview
  const notePreview = document.getElementById('note-preview');

  // Toast
  const statusToast = document.getElementById('status-toast');

  // Application State
  let currentNote = null;
  let activeFolder = '';
  let selectedTerminalId = 'cmd';
  let selectedRunMode = 'capture';
  let defaultDirectory = '';
  let isPinned = false;
  let isPreview = false;
  let saveTimeout = null;
  let toastTimeout = null;
  let availableTerminals = [];
  let lastFocusedArea = 'editor';

  function adjustEditorHeight() {
    if (!noteEditorArea || !noteTextarea || !outputWrapper) return;
    if (outputWrapper.classList.contains('hidden')) {
      noteEditorArea.style.flex = '1 1 auto';
      noteEditorArea.style.height = 'auto';
      noteEditorArea.style.maxHeight = 'none';
      outputWrapper.style.flex = '0 0 auto';
      if (outputScrollPane) {
        outputScrollPane.style.height = 'auto';
      }
      return;
    }

    // Output is visible:
    // 1. Give the note editor a comfortable content-based height (clamped)
    const noteText = noteTextarea.value || '';
    const noteLines = Math.max(1, noteText.split('\n').length);
    const contentNoteHeight = noteLines * 20 + 8;
    const availableBody = stickyBody ? stickyBody.clientHeight : 220;

    // Pin note editor to comfortable height (min 48px, max 42% of body height)
    const clampedNoteHeight = Math.max(48, Math.min(contentNoteHeight, Math.floor(availableBody * 0.42)));

    noteEditorArea.style.flex = '0 0 auto';
    noteEditorArea.style.height = `${clampedNoteHeight}px`;

    // 2. Output wrapper and scroll pane take flex: 1 1 auto so all vertical resizing expands the output box
    outputWrapper.style.flex = '1 1 auto';
    outputWrapper.style.minHeight = '60px';
    outputWrapper.style.height = 'auto';

    if (outputScrollPane) {
      outputScrollPane.style.flex = '1 1 auto';
      outputScrollPane.style.height = '100%';
      outputScrollPane.style.maxHeight = 'none';

      const outputText = noteOutputPre ? (noteOutputPre.textContent || '') : '';
      const rawLines = outputText.trim() ? outputText.trim().split('\n').length : 1;
      const minLines = Math.min(Math.max(rawLines, 2), 4);
      outputScrollPane.style.minHeight = `${minLines * 18 + 8}px`;
    }
  }

  function showStatus(text, isError = false) {
    if (!statusToast) return;
    clearTimeout(toastTimeout);
    statusToast.textContent = text;
    statusToast.classList.remove('hidden');
    if (isError) {
      statusToast.classList.add('error');
    } else {
      statusToast.classList.remove('error');
    }
    toastTimeout = setTimeout(() => {
      statusToast.classList.add('hidden');
    }, 2500);
  }

  async function loadDefaultDir() {
    try {
      if (window.stickyShellAPI.getDefaultDirectory) {
        defaultDirectory = await window.stickyShellAPI.getDefaultDirectory();
      }
    } catch (_) {}
    updateFolderUI();
  }

  // Load Note
  async function loadNoteData() {
    try {
      const noteId = await window.stickyShellAPI.getCurrentNoteId();
      currentNote = await window.stickyShellAPI.getNote(noteId);

      if (currentNote) {
        noteTextarea.value = currentNote.content || '';
        selectedTerminalId = currentNote.terminal || 'cmd';
        activeFolder = currentNote.customFolder || '';
        selectedRunMode = currentNote.runMode || 'capture';
        isPinned = !!currentNote.isPinned;

        if (radioModeCapture && radioModeExternal) {
          if (selectedRunMode === 'external') {
            radioModeExternal.checked = true;
          } else {
            radioModeCapture.checked = true;
          }
        }

        updatePinUI();
        updateFolderUI();
        adjustEditorHeight();
        if (isPreview) updatePreview();
      }
    } catch (err) {
      console.error('Failed to load note:', err);
    }
  }

  function updatePinUI() {
    if (btnPin) {
      if (isPinned) {
        btnPin.classList.add('pinned');
        btnPin.classList.add('active');
        btnPin.title = 'Unpin from top';
      } else {
        btnPin.classList.remove('pinned');
        btnPin.classList.remove('active');
        btnPin.title = 'Pin to top (Always on top)';
      }
    }
    if (menuPin) {
      if (isPinned) {
        menuPin.classList.add('pinned');
      } else {
        menuPin.classList.remove('pinned');
      }
    }
    if (menuPinText) {
      menuPinText.textContent = isPinned ? 'Unpin from Top' : 'Pin to Top';
    }
  }

  function updateFolderUI() {
    if (!folderPathDisplay) return;
    if (activeFolder) {
      const displayPath = activeFolder.length > 25
        ? '...' + activeFolder.slice(-22)
        : activeFolder;
      folderPathDisplay.textContent = displayPath;
      folderPathDisplay.title = activeFolder;
      if (btnClearFolder) btnClearFolder.classList.remove('hidden');
    } else {
      const displayDefault = defaultDirectory
        ? (defaultDirectory.length > 22 ? 'Default (~' + defaultDirectory.slice(-16) + ')' : `Default (${defaultDirectory})`)
        : 'Default (User Dir)';
      folderPathDisplay.textContent = displayDefault;
      folderPathDisplay.title = defaultDirectory || 'Default User Working Directory';
      if (btnClearFolder) btnClearFolder.classList.add('hidden');
    }
  }

  // Auto-Save Note
  function scheduleSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      if (!currentNote) return;
      currentNote.content = noteTextarea.value;
      currentNote.terminal = selectedTerminalId;
      currentNote.customFolder = activeFolder || null;
      currentNote.runMode = selectedRunMode;
      currentNote.isPinned = isPinned;
      try {
        await window.stickyShellAPI.saveNote(currentNote);
      } catch (e) {
        console.error('Auto-save error:', e);
      }
    }, 400);
  }

  noteTextarea.addEventListener('input', () => {
    scheduleSave();
    adjustEditorHeight();
    if (isPreview) updatePreview();
  });

  if (radioModeExternal) {
    radioModeExternal.addEventListener('change', () => {
      if (radioModeExternal.checked) {
        selectedRunMode = 'external';
        scheduleSave();
      }
    });
  }

  if (radioModeCapture) {
    radioModeCapture.addEventListener('change', () => {
      if (radioModeCapture.checked) {
        selectedRunMode = 'capture';
        scheduleSave();
      }
    });
  }

  // Terminals List
  async function loadTerminals() {
    try {
      availableTerminals = await window.stickyShellAPI.getAvailableTerminals();
      renderTerminalRadios();
    } catch (e) {
      console.error('Failed to get terminals:', e);
    }
  }

  function renderTerminalRadios() {
    if (!flyoutTerminalList) return;
    flyoutTerminalList.innerHTML = '';

    availableTerminals.forEach((term) => {
      const label = document.createElement('label');
      label.className = 'flyout-radio-option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'terminal-shell';
      input.value = term.id;
      if (term.id === selectedTerminalId) {
        input.checked = true;
      }

      input.addEventListener('change', () => {
        selectedTerminalId = term.id;
        scheduleSave();
      });

      const spanCustom = document.createElement('span');
      spanCustom.className = 'radio-custom';

      const spanLabel = document.createElement('span');
      spanLabel.className = 'radio-label';
      spanLabel.textContent = term.name;

      label.appendChild(input);
      label.appendChild(spanCustom);
      label.appendChild(spanLabel);

      flyoutTerminalList.appendChild(label);
    });
  }

  // Run Command Execution
  async function handleRunCommand() {
    const fullText = noteTextarea.value || '';
    const selStart = noteTextarea.selectionStart;
    const selEnd = noteTextarea.selectionEnd;
    let cmdToRun = '';

    if (selEnd > selStart) {
      cmdToRun = fullText.substring(selStart, selEnd).trim();
    } else {
      cmdToRun = fullText.trim();
    }

    if (!cmdToRun) {
      showStatus('Note is empty', true);
      return;
    }

    const isCapture = radioModeCapture && radioModeCapture.checked;

  function applyOutputChunk(currentText, newChunk) {
    if (!newChunk.includes('\r')) {
      return currentText + newChunk;
    }
    let buffer = currentText;
    for (let i = 0; i < newChunk.length; i++) {
      const ch = newChunk[i];
      if (ch === '\r') {
        if (i + 1 < newChunk.length && newChunk[i + 1] === '\n') {
          buffer += '\n';
          i++;
        } else {
          // Standalone \r: rewind to last newline
          const lastNl = buffer.lastIndexOf('\n');
          if (lastNl === -1) {
            buffer = '';
          } else {
            buffer = buffer.substring(0, lastNl + 1);
          }
        }
      } else {
        buffer += ch;
      }
    }
    return buffer;
  }

    if (isCapture) {
      showStatus('Running...');
      try {
        if (outputWrapper) outputWrapper.classList.remove('hidden');
        if (noteOutputPre) noteOutputPre.textContent = '';
        if (outputStatusPill) {
          outputStatusPill.textContent = 'Running';
          outputStatusPill.className = 'output-status-pill';
        }
        adjustEditorHeight();

        let hasReceivedChunk = false;
        let unlistenChunk = null;

        if (window.stickyShellAPI && typeof window.stickyShellAPI.onCommandOutputChunk === 'function') {
          unlistenChunk = await window.stickyShellAPI.onCommandOutputChunk((event) => {
            const payload = event && event.payload ? event.payload : event;
            const text = (payload && payload.text) || '';
            if (!text) return;
            hasReceivedChunk = true;
            if (noteOutputPre) {
              noteOutputPre.textContent = applyOutputChunk(noteOutputPre.textContent, text);
              adjustEditorHeight();
              noteOutputPre.scrollTop = noteOutputPre.scrollHeight;
            }
          });
        }

        let result;
        const execFn = (window.stickyShellAPI && typeof window.stickyShellAPI.executeStreaming === 'function')
          ? window.stickyShellAPI.executeStreaming
          : window.stickyShellAPI.executeAndCapture;

        try {
          result = await execFn({
            terminalId: selectedTerminalId,
            command: cmdToRun,
            customFolder: activeFolder || null
          });
        } finally {
          if (typeof unlistenChunk === 'function') {
            unlistenChunk();
          }
        }

        if (outputWrapper && noteOutputPre) {
          if (!hasReceivedChunk) {
            const outputText = (result && result.stdout ? result.stdout : '') + (result && result.stderr ? (result.stdout ? '\n' : '') + result.stderr : '');
            noteOutputPre.textContent = outputText || '(No output)';
          } else if (!noteOutputPre.textContent.trim()) {
            noteOutputPre.textContent = '(No output)';
          }

          if (outputStatusPill) {
            const code = result ? (result.exitCode !== undefined ? result.exitCode : 0) : 0;
            outputStatusPill.textContent = code === 0 ? 'Success' : `Exit ${code}`;
            outputStatusPill.className = 'output-status-pill ' + (code === 0 ? 'success' : 'error');
          }

          adjustEditorHeight();
          noteOutputPre.scrollTop = noteOutputPre.scrollHeight;
        }
        showStatus('Finished');
      } catch (err) {
        showStatus('Execution failed', true);
        if (outputWrapper && noteOutputPre) {
          outputWrapper.classList.remove('hidden');
          noteOutputPre.textContent = `Error: ${err.message || err}`;
          if (outputStatusPill) {
            outputStatusPill.textContent = 'Error';
            outputStatusPill.className = 'output-status-pill error';
          }
          adjustEditorHeight();
        }
      }
    } else {
      // External window
      try {
        await window.stickyShellAPI.runInTerminal({
          terminalId: selectedTerminalId,
          command: cmdToRun,
          customFolder: activeFolder || null
        });
        showStatus('Launched terminal');
      } catch (err) {
        showStatus('Failed to launch: ' + (err.message || err), true);
      }
    }
  }

  // Event Listeners: Run
  if (menuRun) {
    menuRun.addEventListener('click', () => {
      dropdownMenu.classList.add('hidden');
      handleRunCommand();
    });
  }

  noteTextarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand();
    }
  });

  noteTextarea.addEventListener('focus', () => {
    lastFocusedArea = 'editor';
  });
  noteTextarea.addEventListener('pointerdown', () => {
    lastFocusedArea = 'editor';
  });

  if (noteEditorArea) {
    noteEditorArea.addEventListener('pointerdown', () => {
      lastFocusedArea = 'editor';
    });
  }

  // Run Options Flyout Toggle

  if (menuRunOpts) {
    menuRunOpts.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.add('hidden');
      runOptionsFlyout.classList.toggle('hidden');
    });
  }

  // Flyout Back button -> returns to 3-dot dropdown menu
  if (btnFlyoutBack) {
    btnFlyoutBack.addEventListener('click', (e) => {
      e.stopPropagation();
      runOptionsFlyout.classList.add('hidden');
      dropdownMenu.classList.remove('hidden');
    });
  }

  // Folder Pick / Reset
  if (btnSelectFolder) {
    btnSelectFolder.addEventListener('click', async () => {
      try {
        const folder = await window.stickyShellAPI.pickFolder();
        if (folder) {
          activeFolder = folder;
          updateFolderUI();
          scheduleSave();
        }
      } catch (e) {
        console.error('Pick folder error:', e);
      }
    });
  }

  if (btnClearFolder) {
    btnClearFolder.addEventListener('click', (e) => {
      e.stopPropagation();
      activeFolder = '';
      updateFolderUI();
      scheduleSave();
    });
  }

  // Pin / Always-on-top
  async function togglePinState() {
    isPinned = !isPinned;
    updatePinUI();
    try {
      await window.stickyShellAPI.togglePin(isPinned);
      scheduleSave();
      showStatus(isPinned ? 'Pinned to top' : 'Unpinned');
    } catch (e) {
      console.error('Toggle pin error:', e);
    }
  }

  if (btnPin) btnPin.addEventListener('click', togglePinState);
  if (menuPin) {
    menuPin.addEventListener('click', () => {
      dropdownMenu.classList.add('hidden');
      togglePinState();
    });
  }

  // New Note
  async function handleNewNote() {
    try {
      await window.stickyShellAPI.createNewNote();
    } catch (e) {
      console.error('New note error:', e);
    }
  }
  if (btnNewNote) btnNewNote.addEventListener('click', handleNewNote);
  if (menuNewNote) {
    menuNewNote.addEventListener('click', () => {
      dropdownMenu.classList.add('hidden');
      handleNewNote();
    });
  }

  // Delete Note
  async function handleDeleteNote() {
    if (!currentNote) return;
    try {
      await window.stickyShellAPI.deleteNote(currentNote.id);
    } catch (e) {
      console.error('Delete note error:', e);
    }
  }
  if (btnDelete) btnDelete.addEventListener('click', handleDeleteNote);
  if (menuDelete) {
    menuDelete.addEventListener('click', () => {
      dropdownMenu.classList.add('hidden');
      handleDeleteNote();
    });
  }

  // Undo Delete
  if (menuUndoDelete) {
    menuUndoDelete.addEventListener('click', async () => {
      dropdownMenu.classList.add('hidden');
      try {
        const restored = await window.stickyShellAPI.undoDelete();
        if (restored) {
          showStatus('Restored note');
        } else {
          showStatus('No notes to restore', true);
        }
      } catch (e) {
        showStatus('Undo failed', true);
      }
    });
  }

  // Menu Toggle
  if (btnMenu) {
    btnMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      runOptionsFlyout.classList.add('hidden');
      dropdownMenu.classList.toggle('hidden');
    });
  }

  // Settings
  if (menuSettings) {
    menuSettings.addEventListener('click', async () => {
      dropdownMenu.classList.add('hidden');
      try {
        await window.stickyShellAPI.openSettings();
      } catch (e) {
        console.error('Open settings error:', e);
      }
    });
  }

  // Close Note
  async function handleCloseNote() {
    if (!currentNote) return;
    try {
      await window.stickyShellAPI.closeNote(currentNote.id);
    } catch (e) {
      console.error('Close note error:', e);
    }
  }
  if (btnClose) btnClose.addEventListener('click', handleCloseNote);
  if (menuCloseWindow) {
    menuCloseWindow.addEventListener('click', () => {
      dropdownMenu.classList.add('hidden');
      handleCloseNote();
    });
  }

  // Exit App
  if (menuExit) {
    menuExit.addEventListener('click', async () => {
      dropdownMenu.classList.add('hidden');
      try {
        await window.stickyShellAPI.exitApp();
      } catch (e) {
        console.error('Exit error:', e);
      }
    });
  }

  // Output Pane Controls
  if (outputWrapper) {
    outputWrapper.addEventListener('pointerdown', () => {
      lastFocusedArea = 'output';
    });
  }

  if (outputScrollPane) {
    outputScrollPane.addEventListener('pointerdown', () => {
      lastFocusedArea = 'output';
    });
  }

  if (noteOutputPre) {
    noteOutputPre.addEventListener('pointerdown', () => {
      lastFocusedArea = 'output';
    });
  }

  if (btnCloseOutput) {
    btnCloseOutput.addEventListener('click', () => {
      outputWrapper.classList.add('hidden');
      lastFocusedArea = 'editor';
      adjustEditorHeight();
    });
  }

  if (btnCopyOutput) {
    btnCopyOutput.addEventListener('click', () => {
      if (noteOutputPre && noteOutputPre.textContent) {
        navigator.clipboard.writeText(noteOutputPre.textContent);
        showStatus('Output copied');
      }
    });
  }

  // Global Click to close flyouts
  document.addEventListener('click', (e) => {
    if (!dropdownMenu.classList.contains('hidden') && !dropdownMenu.contains(e.target) && e.target !== btnMenu && (!btnMenu || !btnMenu.contains(e.target)) && (!btnFlyoutBack || !btnFlyoutBack.contains(e.target))) {
      dropdownMenu.classList.add('hidden');
    }
    if (!runOptionsFlyout.classList.contains('hidden') && !runOptionsFlyout.contains(e.target) && (!menuRunOpts || !menuRunOpts.contains(e.target))) {
      runOptionsFlyout.classList.add('hidden');
    }
  });

  // Prevent closing when clicking inside flyouts
  if (dropdownMenu) dropdownMenu.addEventListener('click', (e) => e.stopPropagation());
  if (runOptionsFlyout) runOptionsFlyout.addEventListener('click', (e) => e.stopPropagation());

  // LaTeX, KaTeX & Text Formatting
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTextWithLatexAndMarkdown(rawText) {
    if (!rawText || !rawText.trim()) {
      return '<div class="preview-empty">Empty note. Double-click or press Ctrl+P to edit.</div>';
    }

    // 1. Extract math blocks to protect them from regex text formatting
    const mathBlocks = [];
    let text = rawText;

    // Display math: $$...$$ or \[...\]
    text = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, (match) => {
      mathBlocks.push(match);
      return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
    });

    // Inline math: $...$ (single line math) or \(...\)
    text = text.replace(/(\$[^$\n]+\$|\\\([\s\S]*?\\\))/g, (match) => {
      mathBlocks.push(match);
      return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
    });

    // 2. Escape HTML for safe rendering
    let escaped = escapeHtml(text);

    // 3. LaTeX text styling commands:
    // \textbf{bold}
    escaped = escaped.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
    // \underline{underline}
    escaped = escaped.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');
    // \textit{italic} or \emph{italic}
    escaped = escaped.replace(/\\(?:textit|emph)\{([^}]+)\}/g, '<em>$1</em>');
    // \sout{strike} or \st{strike}
    escaped = escaped.replace(/\\(?:sout|st)\{([^}]+)\}/g, '<s>$1</s>');
    // \texttt{code}
    escaped = escaped.replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>');
    // \section{Header}
    escaped = escaped.replace(/\\section\{([^}]+)\}/g, '<h2 class="latex-h2">$1</h2>');
    // \subsection{Subheader}
    escaped = escaped.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="latex-h3">$1</h3>');

    // 4. Markdown text formatting:
    // Bold: **text** or __text__
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    escaped = escaped.replace(/(^|[^\\])\*([^*]+)\*/g, '$1<em>$2</em>');
    escaped = escaped.replace(/(^|[^\\])_([^_]+)_/g, '$1<em>$2</em>');
    // Inline code: `text`
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 5. Preserve newlines
    escaped = escaped.replace(/\n/g, '<br>');

    // 6. Restore math blocks
    escaped = escaped.replace(/___MATH_BLOCK_(\d+)___/g, (_, idx) => {
      return mathBlocks[parseInt(idx, 10)] || '';
    });

    return escaped;
  }

  function updatePreview() {
    if (!notePreview) return;
    const text = noteTextarea ? noteTextarea.value : '';
    notePreview.innerHTML = formatTextWithLatexAndMarkdown(text);

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(notePreview, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX rendering error:', err);
      }
    }
  }

  function togglePreviewMode(enable) {
    if (enable === undefined) {
      isPreview = !isPreview;
    } else {
      isPreview = !!enable;
    }

    if (isPreview) {
      updatePreview();
      if (noteTextarea) noteTextarea.classList.add('hidden');
      if (notePreview) notePreview.classList.remove('hidden');
      if (menuPreviewText) menuPreviewText.textContent = 'Edit Note';
      showStatus('Preview Mode');
    } else {
      if (notePreview) notePreview.classList.add('hidden');
      if (noteTextarea) {
        noteTextarea.classList.remove('hidden');
        noteTextarea.focus();
      }
      if (menuPreviewText) menuPreviewText.textContent = 'Preview (LaTeX / Math)';
      showStatus('Edit Mode');
    }
    adjustEditorHeight();
  }

  // Preview Event Listeners
  if (menuTogglePreview) {
    menuTogglePreview.addEventListener('click', () => {
      dropdownMenu.classList.add('hidden');
      togglePreviewMode();
    });
  }

  if (notePreview) {
    notePreview.addEventListener('dblclick', () => {
      togglePreviewMode(false);
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      togglePreviewMode();
      return;
    }

    // Scoped Ctrl+A / Cmd+A selection
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      const activeEl = document.activeElement;
      const isInsideInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl !== noteTextarea;
      if (isInsideInput) {
        return;
      }

      e.preventDefault();
      const isOutputVisible = outputWrapper && !outputWrapper.classList.contains('hidden');
      const isInsideOutput = (outputWrapper && outputWrapper.contains(activeEl)) || lastFocusedArea === 'output';

      if (isOutputVisible && isInsideOutput && noteOutputPre) {
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(noteOutputPre);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else if (noteTextarea && !isPreview) {
        lastFocusedArea = 'editor';
        noteTextarea.focus();
        noteTextarea.select();
      } else if (isPreview && notePreview) {
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(notePreview);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      return;
    }
  });

  // Window resize observer for dynamic textarea sizing
  window.addEventListener('resize', adjustEditorHeight);

  // Real-time terminals synchronization
  if (window.stickyShellAPI && window.stickyShellAPI.onTerminalsChanged) {
    window.stickyShellAPI.onTerminalsChanged(async () => {
      await loadTerminals();
    });
  }

  // Initialize
  await loadDefaultDir();
  await loadTerminals();
  await loadNoteData();
});
