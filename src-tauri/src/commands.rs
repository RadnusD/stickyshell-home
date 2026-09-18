#[cfg(feature = "developer")]
use crate::store::Snippet;
use crate::store::{Note, StoreManager};
use crate::terminal::{ExecutionResult, TerminalInfo, TerminalRunner};
use crate::window_manager::WindowManager;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunCommandOptions {
    #[serde(rename = "terminalId")]
    pub terminal_id: String,
    pub command: String,
    #[serde(rename = "customFolder")]
    pub custom_folder: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditionStatus {
    pub edition: String,
    #[serde(rename = "isPro")]
    pub is_pro: bool,
    #[serde(rename = "hasLicenseKey")]
    pub has_license_key: bool,
    #[serde(rename = "safetyGuardEnabled")]
    pub safety_guard_enabled: bool,
    #[serde(rename = "secretMaskingEnabled")]
    pub secret_masking_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseResult {
    pub success: bool,
    pub edition: String,
    pub message: String,
}

#[tauri::command]
pub fn log_frontend_error(error: String) {
    eprintln!("[FRONTEND ERROR] {}", error);
    let log_path = std::env::current_dir().unwrap_or_default().join("frontend_error.log");
    let _ = std::fs::write(log_path, format!("{}\n", error));
}

#[tauri::command]
pub async fn get_current_note_id(window: WebviewWindow) -> Result<String, String> {
    let label = window.label();
    let id = label.strip_prefix("note-").unwrap_or(label);
    Ok(id.to_string())
}

#[tauri::command]
pub async fn get_note(
    id: String,
    store: State<'_, Arc<StoreManager>>,
) -> Result<Note, String> {
    if let Some(note) = store.get_note(&id) {
        Ok(note)
    } else {
        let settings = store.get_settings();
        // Create initial default note (8 lines height)
        let new_note = Note {
            id: if id.is_empty() { Uuid::new_v4().to_string() } else { id },
            title: Some("".to_string()),
            content: "".to_string(),
            terminal: Some(settings.default_terminal),
            custom_folder: settings.default_folder,
            run_mode: Some(settings.default_run_mode),
            x: None,
            y: None,
            width: Some(270.0),
            height: Some(220.0),
            is_pinned: Some(false),
            theme: Some("classic-yellow".to_string()),
            opacity: Some(100.0),
            created_at: None,
            updated_at: None,
        };
        Ok(store.save_note(new_note))
    }
}

#[tauri::command]
pub async fn save_note(
    note: Note,
    store: State<'_, Arc<StoreManager>>,
) -> Result<Note, String> {
    Ok(store.save_note(note))
}

#[tauri::command]
pub async fn delete_note(
    id: String,
    window: WebviewWindow,
    app: AppHandle,
    store: State<'_, Arc<StoreManager>>,
) -> Result<bool, String> {
    let settings = store.get_settings();
    if settings.confirm_delete {
        use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
        let confirmed = app
            .dialog()
            .message("Are you sure you want to delete this note?\n\nIt will be moved to the safe Undo Delete buffer.")
            .title("Delete Note - StickyShell")
            .kind(MessageDialogKind::Warning)
            .buttons(MessageDialogButtons::OkCancel)
            .blocking_show();
        if !confirmed {
            return Ok(false);
        }
    }
    let res = store.delete_note(&id);
    let _ = window.close();
    Ok(res)
}

#[tauri::command]
pub async fn undo_delete(
    app: AppHandle,
    store: State<'_, Arc<StoreManager>>,
) -> Result<Option<Note>, String> {
    if let Some(restored) = store.undo_delete() {
        WindowManager::spawn_note_window(
            &app,
            &restored.id,
            restored.x,
            restored.y,
            restored.width,
            restored.height,
        )?;
        Ok(Some(restored))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn create_new_note(
    app: AppHandle,
    store: State<'_, Arc<StoreManager>>,
) -> Result<String, String> {
    let settings = store.get_settings();
    let new_id = Uuid::new_v4().to_string();
    let note = Note {
        id: new_id.clone(),
        title: Some("".to_string()),
        content: "".to_string(),
        terminal: Some(settings.default_terminal),
        custom_folder: settings.default_folder,
        run_mode: Some(settings.default_run_mode),
        x: None,
        y: None,
        width: Some(270.0),
        height: Some(220.0),
        is_pinned: Some(false),
        theme: Some("classic-yellow".to_string()),
        opacity: Some(100.0),
        created_at: None,
        updated_at: None,
    };
    store.save_note(note);
    WindowManager::spawn_note_window(&app, &new_id, None, None, Some(270.0), Some(220.0))?;
    Ok(new_id)
}

#[tauri::command]
pub async fn close_note_window(
    id: String,
    app: AppHandle,
) -> Result<(), String> {
    let label = format!("note-{}", id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.close();
    }
    Ok(())
}

#[tauri::command]
pub async fn open_settings_window(app: AppHandle) -> Result<(), String> {
    WindowManager::open_settings_window(&app)
}

#[tauri::command]
pub async fn set_always_on_top(
    is_pinned: bool,
    window: WebviewWindow,
) -> Result<(), String> {
    window
        .set_always_on_top(is_pinned)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_available_terminals(
    store: State<'_, Arc<StoreManager>>,
) -> Result<Vec<TerminalInfo>, String> {
    let mut list = TerminalRunner::get_available_terminals();
    for ct in store.get_custom_terminals() {
        list.push(TerminalInfo {
            id: ct.id,
            name: ct.name,
            command: ct.command.clone(),
            exe_path: Some(ct.command),
            term_type: Some("custom".to_string()),
            is_default: false,
        });
    }
    Ok(list)
}

#[tauri::command]
pub fn run_in_terminal(options: RunCommandOptions) -> Result<(), String> {
    TerminalRunner::run_in_external_terminal(
        &options.terminal_id,
        &options.command,
        options.custom_folder.as_deref(),
    )
}

#[tauri::command]
pub async fn execute_and_capture(
    options: RunCommandOptions,
) -> Result<ExecutionResult, String> {
    TerminalRunner::execute_and_capture(
        &options.terminal_id,
        &options.command,
        options.custom_folder.as_deref(),
    )
}

#[tauri::command]
pub async fn pick_folder(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let folder = app.dialog().file().blocking_pick_folder();
    Ok(folder.map(|p| p.to_string()))
}

#[tauri::command]
pub fn get_edition_status(
    store: State<'_, Arc<StoreManager>>,
) -> Result<EditionStatus, String> {
    #[cfg(feature = "developer")]
    {
        let settings = store.get_settings();
        let has_key = settings.license_key.is_some();
        Ok(EditionStatus {
            edition: "developer".to_string(),
            is_pro: true,
            has_license_key: has_key,
            safety_guard_enabled: settings.safety_guard_enabled,
            secret_masking_enabled: settings.secret_masking_enabled,
        })
    }
    #[cfg(not(feature = "developer"))]
    {
        let _ = store;
        Ok(EditionStatus {
            edition: "home".to_string(),
            is_pro: false,
            has_license_key: false,
            safety_guard_enabled: false,
            secret_masking_enabled: false,
        })
    }
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn activate_license(
    key: String,
    app: AppHandle,
    store: State<'_, Arc<StoreManager>>,
) -> Result<LicenseResult, String> {
    let (success, edition, message) = store.activate_license(&key);
    if success {
        let is_pro = edition == "developer";
        let settings = store.get_settings();
        let status = EditionStatus {
            edition: edition.clone(),
            is_pro,
            has_license_key: true,
            safety_guard_enabled: settings.safety_guard_enabled,
            secret_masking_enabled: settings.secret_masking_enabled,
        };
        WindowManager::update_tray_menu(&app, &edition);
        WindowManager::broadcast_to_notes(&app, "edition-changed", status);
    }
    Ok(LicenseResult {
        success,
        edition,
        message,
    })
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn switch_edition_mode(
    mode: String,
    app: AppHandle,
    store: State<'_, Arc<StoreManager>>,
) -> Result<LicenseResult, String> {
    let (success, edition) = store.switch_edition_mode(&mode);
    let is_pro = edition == "developer";
    let settings = store.get_settings();
    let status = EditionStatus {
        edition: edition.clone(),
        is_pro,
        has_license_key: settings.license_key.is_some(),
        safety_guard_enabled: settings.safety_guard_enabled,
        secret_masking_enabled: settings.secret_masking_enabled,
    };
    WindowManager::update_tray_menu(&app, &edition);
    WindowManager::broadcast_to_notes(&app, "edition-changed", status);
    Ok(LicenseResult {
        success,
        edition: edition.clone(),
        message: format!("Switched to {} mode", edition),
    })
}

#[tauri::command]
pub fn resize_note_window(
    width: f64,
    height: f64,
    window: WebviewWindow,
) -> Result<(), String> {
    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));
    Ok(())
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn get_snippets(
    store: State<'_, Arc<StoreManager>>,
) -> Result<Vec<Snippet>, String> {
    Ok(store.get_snippets())
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn save_snippet(
    snippet: Snippet,
    store: State<'_, Arc<StoreManager>>,
) -> Result<Snippet, String> {
    Ok(store.save_snippet(snippet))
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn delete_snippet(
    id: String,
    store: State<'_, Arc<StoreManager>>,
) -> Result<bool, String> {
    Ok(store.delete_snippet(&id))
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn search_notes(
    query: String,
    store: State<'_, Arc<StoreManager>>,
) -> Result<Vec<Note>, String> {
    Ok(store.search_notes(&query))
}

#[tauri::command]
pub fn focus_note_window(
    note_id: String,
    app: AppHandle,
) -> Result<(), String> {
    let label = format!("note-{}", note_id);
    if let Some(win) = app.get_webview_window(&label) {
        let _ = win.show();
        let _ = win.set_focus();
    }
    Ok(())
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn set_window_opacity(
    opacity: f64,
    window: WebviewWindow,
) -> Result<(), String> {
    let _ = window.emit("window-opacity-changed", opacity);
    Ok(())
}

#[cfg(feature = "developer")]
#[tauri::command]
pub fn set_note_theme(
    theme: String,
    app: AppHandle,
    store: State<'_, Arc<StoreManager>>,
) -> Result<(), String> {
    let mut settings = store.get_settings();
    settings.active_theme = theme.clone();
    store.update_settings(settings);
    WindowManager::broadcast_to_notes(&app, "theme-changed", theme);
    Ok(())
}

#[tauri::command]
pub fn get_settings(
    store: State<'_, Arc<StoreManager>>,
) -> Result<crate::store::Settings, String> {
    Ok(store.get_settings())
}

#[tauri::command]
pub fn save_settings(
    settings: serde_json::Value,
    store: State<'_, Arc<StoreManager>>,
) -> Result<crate::store::Settings, String> {
    Ok(store.update_settings_partial(settings))
}

#[tauri::command]
pub fn add_custom_terminal(
    terminal: crate::store::CustomTerminal,
    store: State<'_, Arc<StoreManager>>,
    app: AppHandle,
) -> Result<crate::store::CustomTerminal, String> {
    let t = store.add_custom_terminal(terminal);
    let _ = app.emit("terminals-changed", ());
    Ok(t)
}

#[tauri::command]
pub fn remove_custom_terminal(
    id: String,
    store: State<'_, Arc<StoreManager>>,
    app: AppHandle,
) -> Result<bool, String> {
    let ok = store.remove_custom_terminal(&id);
    let _ = app.emit("terminals-changed", ());
    Ok(ok)
}

#[tauri::command]
pub async fn pick_terminal_exe(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let file = app.dialog().file().blocking_pick_file();
    Ok(file.map(|p| p.to_string()))
}

#[tauri::command]
pub fn get_default_working_directory() -> String {
    crate::terminal::get_default_working_dir()
}

#[tauri::command]
pub async fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with("http://") && !url.starts_with("https://") && !url.starts_with("tg://") {
        return Err("Invalid URL protocol".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        let _ = &app;
        use std::process::Command;
        let _ = Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", &url])
            .spawn();
    }
    #[cfg(not(target_os = "windows"))]
    {
        use tauri_plugin_shell::ShellExt;
        let _ = app.shell().open(&url, None);
    }
    Ok(())
}

#[tauri::command]
pub async fn get_system_diagnostics(
    store: State<'_, Arc<StoreManager>>,
) -> Result<String, String> {
    let settings = store.get_settings();
    let note_count = store.get_all_notes().len();
    let os_info = std::env::consts::OS;
    let arch_info = std::env::consts::ARCH;
    let default_dir = crate::terminal::get_default_working_dir();
    let now = chrono::Utc::now().to_rfc3339();

    let diag = format!(
        "### StickyShell Diagnostics Report\n\
         - **App Edition**: StickyShell Home Edition (v1.0.0)\n\
         - **OS Platform**: {} ({})\n\
         - **Default Shell**: {}\n\
         - **Default Run Mode**: {}\n\
         - **Default Working Dir**: {}\n\
         - **Active Notes**: {}\n\
         - **Timestamp**: {}\n",
        os_info, arch_info, settings.default_terminal, settings.default_run_mode, default_dir, note_count, now
    );
    Ok(diag)
}

#[tauri::command]
pub fn exit_app(app: AppHandle) -> Result<(), String> {
    let _ = app;
    std::process::exit(0);
}


