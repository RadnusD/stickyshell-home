# StickyShell Project Rule: Tauri v2 & WebView2 Window Creation & Thread Safety

## Background & Root Cause Analysis
On Windows (WebView2), creating a window via `WebviewWindowBuilder::build()` requires message pump cycles on the main UI thread to complete initialization of the WebView2 controller.
Calling `WebviewWindowBuilder::build()` inside a **synchronous** Tauri command (`pub fn`) or a synchronous Win32 event callback (such as `on_menu_event`) running on the main UI thread causes a **reentrancy deadlock**:
- The synchronous command waits on `build()` to complete.
- The WebView2 controller waits on the main message loop to initialize.
- The main message loop is blocked waiting for the command to finish.
- **Symptom**: Spawns an uninitialized blank white window and locks the entire application in a "Not Responding" frozen state.

## Mandatory Rules for All Edits to this Project:
1. **Always Use `async fn` for Window Commands**:
   Any Tauri command that creates, spawns, or manages windows (`create_new_note`, `undo_delete`, `open_settings_window`, etc.) MUST be marked as `pub async fn` so it executes on Tokio worker threads off the main UI thread.
2. **Never Block in Event Handlers**:
   Any tray icon menu handler (`on_menu_event`), keyboard shortcut handler, or Tauri event callback that initiates window creation MUST offload the operation using `std::thread::spawn` or `tauri::async_runtime::spawn`.
3. **Async for Modal & Blocking Operations**:
   Any command invoking blocking dialogs (`blocking_pick_folder`, `blocking_pick_file`) or external process execution MUST be `pub async fn`.
4. **Window Position Cascading**:
   When spawning note windows without explicit coordinates, cascade window positions (+30px, +30px) from existing open note windows to avoid stacking on top.
5. **Verification on Every Edit**:
   Whenever an edit is made to commands or window management:
   - Analyze the call graph to confirm no synchronous path from IPC or Win32 message handlers invokes `build()`.
   - Run `cargo check` and `cargo build` to guarantee compilation.
6. **Implementation Plan & Explicit Confirmation Required**:
   - NEVER edit any project files without first presenting a detailed implementation plan and receiving explicit user confirmation and approval.
   - User confirmation must be in the form of `Ctrl+Enter`, `confirm`, or `yes`.
   - If the user does not explicitly provide confirmation and instead asks a question or brings up another topic, treat it as NO confirmation: answer the user's question directly without editing any project files.
