use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

pub struct WindowManager;

impl WindowManager {
    pub fn spawn_note_window(
        app: &AppHandle,
        note_id: &str,
        x: Option<f64>,
        y: Option<f64>,
        width: Option<f64>,
        height: Option<f64>,
    ) -> Result<(), String> {
        let label = format!("note-{}", note_id);

        if let Some(existing) = app.get_webview_window(&label) {
            let _ = existing.show();
            let _ = existing.set_focus();
            return Ok(());
        }

        let w = width.unwrap_or(270.0);
        let h = height.unwrap_or(220.0);
        let url_path = "renderer/note/note.html";

        let init_script = r#"
            window.addEventListener('error', function(e) {
                console.error('[FRONTEND ERROR]', e.message, e.filename, e.lineno);
                try {
                    if (window.__TAURI__ && window.__TAURI__.core) {
                        window.__TAURI__.core.invoke('log_frontend_error', { error: 'Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno });
                    }
                } catch(_) {}
            });
            window.addEventListener('unhandledrejection', function(e) {
                console.error('[UNHANDLED REJECTION]', e.reason);
                try {
                    if (window.__TAURI__ && window.__TAURI__.core) {
                        window.__TAURI__.core.invoke('log_frontend_error', { error: 'Unhandled Rejection: ' + (e.reason ? (e.reason.stack || e.reason) : 'unknown') });
                    }
                } catch(_) {}
            });
        "#;

        let mut builder = WebviewWindowBuilder::new(app, &label, WebviewUrl::App(url_path.into()))
            .title("StickyShell Note")
            .inner_size(w, h)
            .min_inner_size(240.0, 200.0)
            .decorations(false)
            .shadow(true)
            .initialization_script(init_script)
            .devtools(cfg!(debug_assertions));

        let mut pos_x = x;
        let mut pos_y = y;

        if pos_x.is_none() || pos_y.is_none() {
            let existing_windows = app.webview_windows();
            for (w_label, win) in &existing_windows {
                if w_label.starts_with("note-") && w_label != &label {
                    if let Ok(pos) = win.outer_position() {
                        pos_x = Some(pos.x as f64 + 30.0);
                        pos_y = Some(pos.y as f64 + 30.0);
                        break;
                    }
                }
            }
        }

        if let (Some(px), Some(py)) = (pos_x, pos_y) {
            builder = builder.position(px, py);
        }

        let win = builder
            .build()
            .map_err(|e| format!("Failed to create note window: {}", e))?;

        let _ = win.show();
        let _ = win.set_focus();

        Ok(())
    }

    pub fn open_settings_window(app: &AppHandle) -> Result<(), String> {
        let label = "settings";

        if let Some(existing) = app.get_webview_window(label) {
            let _ = existing.show();
            let _ = existing.set_focus();
            return Ok(());
        }

        let store = app.state::<std::sync::Arc<crate::store::StoreManager>>().inner().clone();
        let settings = store.get_settings();
        let title = if settings.edition == "developer" {
            "StickyShell Settings & License"
        } else {
            "StickyShell Settings"
        };

        let win = WebviewWindowBuilder::new(
            app,
            label,
            WebviewUrl::App("renderer/settings/settings.html".into()),
        )
        .title(title)
        .inner_size(780.0, 620.0)
        .min_inner_size(600.0, 480.0)
        .decorations(true)
        .resizable(true)
        .center()
        .devtools(cfg!(debug_assertions))
        .build()
        .map_err(|e| format!("Failed to create settings window: {}", e))?;

        let _ = win.show();
        let _ = win.set_focus();

        Ok(())
    }

    pub fn toggle_all_notes(app: &AppHandle) {
        let mut any_visible = false;
        let windows: Vec<_> = app.webview_windows().into_iter().collect();

        for (label, win) in &windows {
            if label.starts_with("note-") {
                if let Ok(is_vis) = win.is_visible() {
                    if is_vis {
                        any_visible = true;
                        break;
                    }
                }
            }
        }

        for (label, win) in &windows {
            if label.starts_with("note-") {
                if any_visible {
                    let _ = win.hide();
                } else {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
        }
    }

    pub fn toggle_pin_all(app: &AppHandle) {
        let _ = app.emit("toggle-pin", ());
    }

    pub fn ensure_active_note_and_emit(app: &AppHandle, event: &str) {
        let windows: Vec<_> = app.webview_windows().into_iter().collect();
        let mut has_note = false;

        for (label, win) in &windows {
            if label.starts_with("note-") {
                let _ = win.show();
                let _ = win.set_focus();
                has_note = true;
                break;
            }
        }

        if !has_note {
            let store = app.state::<std::sync::Arc<crate::store::StoreManager>>().inner().clone();
            let settings = store.get_settings();
            let app_handle = app.clone();
            let event_name = event.to_string();
            std::thread::spawn(move || {
                let new_id = uuid::Uuid::new_v4().to_string();
                let note = crate::store::Note {
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
                let _ = WindowManager::spawn_note_window(&app_handle, &new_id, None, None, Some(270.0), Some(220.0));
                let _ = app_handle.emit(&event_name, ());
            });
            return;
        }

        let _ = app.emit(event, ());
    }

    pub fn delete_active_note(app: &AppHandle, store: &std::sync::Arc<crate::store::StoreManager>) {
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
                return;
            }
        }
        let windows: Vec<_> = app.webview_windows().into_iter().collect();
        for (label, win) in &windows {
            if label.starts_with("note-") {
                let note_id = label.trim_start_matches("note-");
                let _ = store.delete_note(note_id);
                let _ = win.close();
                break;
            }
        }
    }

    pub fn close_active_note(app: &AppHandle) {
        let windows: Vec<_> = app.webview_windows().into_iter().collect();
        for (label, win) in &windows {
            if label.starts_with("note-") {
                let _ = win.close();
                break;
            }
        }
    }

    pub fn build_tray_menu(app: &AppHandle, edition: &str) -> Result<tauri::menu::Menu<tauri::Wry>, tauri::Error> {
        use tauri::menu::{MenuBuilder, MenuItem, IconMenuItemBuilder};
        use tauri::image::Image;
        let _ = edition;
        #[cfg(feature = "developer")]
        let is_dev = edition == "developer";
        #[cfg(not(feature = "developer"))]
        let is_dev = false;

        let icon_new = Image::from_bytes(include_bytes!("../icons/menu/new_note.png"))?;
        let icon_pin = Image::from_bytes(include_bytes!("../icons/menu/pin.png"))?;
        let icon_undo = Image::from_bytes(include_bytes!("../icons/menu/undo.png"))?;
        let icon_settings = Image::from_bytes(include_bytes!("../icons/menu/settings.png"))?;
        let icon_delete = Image::from_bytes(include_bytes!("../icons/menu/delete.png"))?;
        let icon_close = Image::from_bytes(include_bytes!("../icons/menu/close.png"))?;
        let icon_exit = Image::from_bytes(include_bytes!("../icons/menu/exit.png"))?;

        let new_note_item = IconMenuItemBuilder::with_id("new_note", "New Note\tWin+Alt+N")
            .icon(icon_new)
            .build(app)?;
        let pin_item = IconMenuItemBuilder::with_id("pin", "Pin to Top")
            .icon(icon_pin)
            .build(app)?;
        let undo_delete_item = IconMenuItemBuilder::with_id("undo_delete", "Undo Delete")
            .icon(icon_undo)
            .build(app)?;

        let mut builder = MenuBuilder::new(app)
            .item(&new_note_item)
            .item(&pin_item)
            .item(&undo_delete_item)
            .separator();

        if is_dev {
            let mask_secrets_item = MenuItem::with_id(app, "mask_secrets", "Mask Secrets", true, None::<&str>)?;
            let palette_item = MenuItem::with_id(app, "palette", "Palette", true, None::<&str>)?;
            let snippets_item = MenuItem::with_id(app, "snippets", "Snippets", true, None::<&str>)?;
            let appearance_item = MenuItem::with_id(app, "appearance", "Appearance", true, None::<&str>)?;

            builder = builder
                .item(&mask_secrets_item)
                .item(&palette_item)
                .item(&snippets_item)
                .item(&appearance_item)
                .separator();
        }

        let settings_title = if is_dev { "Settings & License" } else { "Settings" };
        let settings_item = IconMenuItemBuilder::with_id("settings", settings_title)
            .icon(icon_settings)
            .build(app)?;
        let delete_note_item = IconMenuItemBuilder::with_id("delete_note", "Delete Note")
            .icon(icon_delete)
            .build(app)?;
        let close_note_item = IconMenuItemBuilder::with_id("close_note", "Close Note")
            .icon(icon_close)
            .build(app)?;
        let exit_item = IconMenuItemBuilder::with_id("exit", "Exit")
            .icon(icon_exit)
            .build(app)?;

        builder
            .item(&settings_item)
            .separator()
            .item(&delete_note_item)
            .item(&close_note_item)
            .separator()
            .item(&exit_item)
            .build()
    }

    pub fn update_tray_menu(app: &AppHandle, edition: &str) {
        if let Some(tray) = app.tray_by_id("tray") {
            if let Ok(menu) = Self::build_tray_menu(app, edition) {
                let _ = tray.set_menu(Some(menu));
            }
        }
    }

    pub fn broadcast_to_notes<S: serde::Serialize + Clone>(
        app: &AppHandle,
        event: &str,
        payload: S,
    ) {
        let _ = app.emit(event, payload);
    }

    pub fn handle_tray_left_click(app: &AppHandle, _position: tauri::PhysicalPosition<f64>) {
        let store = app.state::<std::sync::Arc<crate::store::StoreManager>>().inner().clone();
        let all_notes = store.get_all_notes();

        if all_notes.is_empty() {
            let settings = store.get_settings();
            let app_handle = app.clone();
            std::thread::spawn(move || {
                let new_id = uuid::Uuid::new_v4().to_string();
                let note = crate::store::Note {
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
                let _ = WindowManager::spawn_note_window(&app_handle, &new_id, None, None, Some(270.0), Some(220.0));
            });
            return;
        }

        let mut open_notes = Vec::new();
        let mut closed_notes = Vec::new();

        for note in &all_notes {
            let label = format!("note-{}", note.id);
            if let Some(win) = app.get_webview_window(&label) {
                if let Ok(is_vis) = win.is_visible() {
                    if is_vis {
                        open_notes.push(note.clone());
                        continue;
                    }
                }
            }
            closed_notes.push(note.clone());
        }

        // Case 1: Exactly 1 closed note exists (and 0 open) -> single press restores and focuses it
        if closed_notes.len() == 1 && open_notes.is_empty() {
            let note = &closed_notes[0];
            let label = format!("note-{}", note.id);
            if let Some(win) = app.get_webview_window(&label) {
                let _ = win.show();
                let _ = win.set_focus();
            } else {
                let app_handle = app.clone();
                let note_clone = note.clone();
                std::thread::spawn(move || {
                    let _ = WindowManager::spawn_note_window(
                        &app_handle,
                        &note_clone.id,
                        note_clone.x,
                        note_clone.y,
                        note_clone.width,
                        note_clone.height,
                    );
                });
            }
            return;
        }

        // Case 2: Exactly 1 open note exists (and 0 closed) -> single press hides it to tray
        if open_notes.len() == 1 && closed_notes.is_empty() {
            let note = &open_notes[0];
            let label = format!("note-{}", note.id);
            if let Some(win) = app.get_webview_window(&label) {
                let _ = win.hide();
            }
            return;
        }

        // Case 3: All notes are currently open -> hide all notes to tray
        if closed_notes.is_empty() && !open_notes.is_empty() {
            for note in &open_notes {
                let label = format!("note-{}", note.id);
                if let Some(win) = app.get_webview_window(&label) {
                    let _ = win.hide();
                }
            }
            return;
        }

        // Case 4: Multiple closed notes exist -> show popup list of closed notes at tray position
        use tauri::menu::{ContextMenu, MenuBuilder, MenuItem};
        let mut builder = MenuBuilder::new(app);

        for (idx, note) in closed_notes.iter().enumerate() {
            let snippet = if let Some(title) = &note.title {
                if !title.trim().is_empty() {
                    title.trim().to_string()
                } else {
                    Self::extract_snippet(&note.content, idx + 1)
                }
            } else {
                Self::extract_snippet(&note.content, idx + 1)
            };

            let item_id = format!("restore_note_{}", note.id);
            let display_title = format!("• {}", snippet);
            if let Ok(item) = MenuItem::with_id(app, &item_id, &display_title, true, None::<&str>) {
                builder = builder.item(&item);
            }
        }

        let all_item_id = "restore_all_notes";
        if let Ok(sep_item) = MenuItem::with_id(app, all_item_id, "• Restore All Notes", true, None::<&str>) {
            builder = builder.separator().item(&sep_item);
        }

        if let Ok(popup_menu) = builder.build() {
            if let Some(win) = app.webview_windows().values().next() {
                let _ = popup_menu.popup(win.as_ref().window().clone());
            }
        }
    }

    fn extract_snippet(content: &str, index: usize) -> String {
        let first_line = content.lines().next().unwrap_or("").trim();
        if first_line.is_empty() {
            format!("Note {}", index)
        } else {
            if first_line.chars().count() > 22 {
                let s: String = first_line.chars().take(20).collect();
                format!("{}...", s)
            } else {
                first_line.to_string()
            }
        }
    }
}
