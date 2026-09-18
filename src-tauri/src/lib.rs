pub mod commands;
pub mod store;
pub mod terminal;
pub mod window_manager;

use commands::*;
use std::sync::Arc;
use store::StoreManager;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use window_manager::WindowManager;

const SINGLE_INSTANCE_PORT: u16 = 47921;

pub fn run() {
    let listener = match std::net::TcpListener::bind(("127.0.0.1", SINGLE_INSTANCE_PORT)) {
        Ok(l) => l,
        Err(_) => {
            // Another instance is already running; ping it to restore/focus windows, then exit.
            use std::io::Write;
            if let Ok(mut stream) = std::net::TcpStream::connect(("127.0.0.1", SINGLE_INSTANCE_PORT)) {
                let _ = stream.write_all(b"wake\n");
                let _ = stream.flush();
            }
            std::process::exit(0);
        }
    };

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let store = match app.try_state::<Arc<StoreManager>>() {
                            Some(s) => s.inner().clone(),
                            None => return,
                        };
                        let settings = store.get_settings();
                        if !settings.global_hotkeys_enabled {
                            return;
                        }

                        let sc_str = shortcut.to_string().to_lowercase();
                        if sc_str.contains("alt") && (sc_str.contains("super") || sc_str.contains("meta")) {
                            if sc_str.contains("keys") || sc_str.ends_with("+s") {
                                WindowManager::toggle_all_notes(app);
                            } else if sc_str.contains("keyn") || sc_str.ends_with("+n") {
                                let app_handle = app.clone();
                                std::thread::spawn(move || {
                                    let new_id = uuid::Uuid::new_v4().to_string();
                                    let note = store::Note {
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
                                    let _ = WindowManager::spawn_note_window(
                                        &app_handle,
                                        &new_id,
                                        None,
                                        None,
                                        Some(270.0),
                                        Some(220.0),
                                    );
                                });
                            }
                        }
                    }
                })
                .build(),
        );

    let app = builder
        .setup(move |app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::current_dir().unwrap());

            let store = Arc::new(StoreManager::new(app_dir));
            app.manage(store.clone());

            let app_handle_for_single_instance = app.handle().clone();
            std::thread::spawn(move || {
                use std::io::{BufRead, BufReader};
                for stream in listener.incoming() {
                    if let Ok(stream) = stream {
                        let mut reader = BufReader::new(stream);
                        let mut line = String::new();
                        let _ = reader.read_line(&mut line);

                        let app_handle = app_handle_for_single_instance.clone();
                        let store = match app_handle.try_state::<Arc<StoreManager>>() {
                            Some(s) => s.inner().clone(),
                            None => continue,
                        };

                        let all_notes = store.get_all_notes();
                        if all_notes.is_empty() {
                            let settings = store.get_settings();
                            let new_id = uuid::Uuid::new_v4().to_string();
                            let note = store::Note {
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
                            let _ = WindowManager::spawn_note_window(
                                &app_handle,
                                &new_id,
                                None,
                                None,
                                Some(270.0),
                                Some(220.0),
                            );
                        } else {
                            for note in all_notes {
                                let label = format!("note-{}", note.id);
                                if let Some(win) = app_handle.get_webview_window(&label) {
                                    let _ = win.unminimize();
                                    let _ = win.show();
                                    let _ = win.set_focus();
                                } else {
                                    let _ = WindowManager::spawn_note_window(
                                        &app_handle,
                                        &note.id,
                                        note.x,
                                        note.y,
                                        note.width,
                                        note.height,
                                    );
                                }
                            }
                        }
                    }
                }
            });

            let _ = app.global_shortcut().register("super+alt+s");
            let _ = app.global_shortcut().register("super+alt+n");

            // Check CLI or environment variable for edition override (developer builds only)
            #[cfg(feature = "developer")]
            {
                let env_edition = std::env::var("STICKYSHELL_EDITION").ok();
                let arg_edition = std::env::args().find_map(|arg| {
                    if arg == "--edition=developer" || arg == "--dev" {
                        Some("developer".to_string())
                    } else if arg == "--edition=home" || arg == "--home" {
                        Some("home".to_string())
                    } else {
                        None
                    }
                });
                if let Some(ed) = env_edition.or(arg_edition) {
                    store.switch_edition_mode(&ed);
                }
            }

            let current_settings = store.get_settings();
            let tray_menu = WindowManager::build_tray_menu(app.handle(), &current_settings.edition)?;

            let mut tray_builder = TrayIconBuilder::with_id("tray")
                .menu(&tray_menu)
                .tooltip("StickyShell - Desktop Terminal Scratchpad")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "new_note" => {
                        let store = app.state::<Arc<StoreManager>>().inner().clone();
                        let settings = store.get_settings();
                        let app_handle = app.clone();
                        std::thread::spawn(move || {
                            let new_id = uuid::Uuid::new_v4().to_string();
                            let note = store::Note {
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
                    }
                    "pin" => {
                        WindowManager::toggle_pin_all(app);
                    }
                    "undo_delete" => {
                        let store = app.state::<Arc<StoreManager>>().inner().clone();
                        let app_handle = app.clone();
                        std::thread::spawn(move || {
                            if let Some(restored) = store.undo_delete() {
                                let _ = WindowManager::spawn_note_window(
                                    &app_handle,
                                    &restored.id,
                                    restored.x,
                                    restored.y,
                                    restored.width,
                                    restored.height,
                                );
                            }
                        });
                    }
                    #[cfg(feature = "developer")]
                    "mask_secrets" => {
                        WindowManager::broadcast_to_notes(app, "toggle-mask", ());
                    }
                    #[cfg(feature = "developer")]
                    "palette" => {
                        WindowManager::ensure_active_note_and_emit(app, "open-palette");
                    }
                    #[cfg(feature = "developer")]
                    "snippets" => {
                        WindowManager::ensure_active_note_and_emit(app, "open-snippets");
                    }
                    #[cfg(feature = "developer")]
                    "appearance" => {
                        WindowManager::ensure_active_note_and_emit(app, "open-appearance");
                    }
                    "settings" => {
                        let app_handle = app.clone();
                        std::thread::spawn(move || {
                            let _ = WindowManager::open_settings_window(&app_handle);
                        });
                    }
                    "delete_note" => {
                        let app_handle = app.clone();
                        let store = app.state::<Arc<StoreManager>>().inner().clone();
                        std::thread::spawn(move || {
                            WindowManager::delete_active_note(&app_handle, &store);
                        });
                    }
                    "close_note" => {
                        WindowManager::close_active_note(app);
                    }
                    "exit" => {
                        std::process::exit(0);
                    }
                    "restore_all_notes" => {
                        let app_handle = app.clone();
                        let store = app.state::<Arc<StoreManager>>().inner().clone();
                        std::thread::spawn(move || {
                            let notes = store.get_all_notes();
                            for note in notes {
                                let label = format!("note-{}", note.id);
                                if let Some(win) = app_handle.get_webview_window(&label) {
                                    let _ = win.show();
                                    let _ = win.set_focus();
                                } else {
                                    let _ = WindowManager::spawn_note_window(
                                        &app_handle,
                                        &note.id,
                                        note.x,
                                        note.y,
                                        note.width,
                                        note.height,
                                    );
                                }
                            }
                        });
                    }
                    id if id.starts_with("restore_note_") => {
                        let note_id = id["restore_note_".len()..].to_string();
                        let app_handle = app.clone();
                        let store = app.state::<Arc<StoreManager>>().inner().clone();
                        std::thread::spawn(move || {
                            let label = format!("note-{}", note_id);
                            if let Some(win) = app_handle.get_webview_window(&label) {
                                let _ = win.show();
                                let _ = win.set_focus();
                            } else if let Some(note) = store.get_note(&note_id) {
                                let _ = WindowManager::spawn_note_window(
                                    &app_handle,
                                    &note.id,
                                    note.x,
                                    note.y,
                                    note.width,
                                    note.height,
                                );
                            }
                        });
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        position,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        WindowManager::handle_tray_left_click(app, position);
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;

            // 2. Spawn initial notes on startup
            let all_notes = store.get_all_notes();
            if all_notes.is_empty() {
                let settings = store.get_settings();
                let default_id = uuid::Uuid::new_v4().to_string();
                let initial_note = store::Note {
                    id: default_id.clone(),
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
                store.save_note(initial_note);
                let _ = WindowManager::spawn_note_window(
                    app.handle(),
                    &default_id,
                    None,
                    None,
                    Some(270.0),
                    Some(220.0),
                );
            } else {
                for note in all_notes {
                    let _ = WindowManager::spawn_note_window(
                        app.handle(),
                        &note.id,
                        note.x,
                        note.y,
                        note.width,
                        note.height,
                    );
                }
            }

            Ok(())
        });

    #[cfg(feature = "developer")]
    let app = app.invoke_handler(tauri::generate_handler![
        log_frontend_error,
        get_current_note_id,
        get_note,
        save_note,
        delete_note,
        undo_delete,
        create_new_note,
        close_note_window,
        open_settings_window,
        set_always_on_top,
        get_available_terminals,
        run_in_terminal,
        execute_and_capture,
        pick_folder,
        get_edition_status,
        activate_license,
        switch_edition_mode,
        get_snippets,
        save_snippet,
        delete_snippet,
        search_notes,
        focus_note_window,
        set_window_opacity,
        set_note_theme,
        get_settings,
        save_settings,
        add_custom_terminal,
        remove_custom_terminal,
        pick_terminal_exe,
        resize_note_window,
        get_default_working_directory,
        open_external_url,
        get_system_diagnostics,
        exit_app
    ]);

    #[cfg(not(feature = "developer"))]
    let app = app.invoke_handler(tauri::generate_handler![
        log_frontend_error,
        get_current_note_id,
        get_note,
        save_note,
        delete_note,
        undo_delete,
        create_new_note,
        close_note_window,
        open_settings_window,
        set_always_on_top,
        get_available_terminals,
        run_in_terminal,
        execute_and_capture,
        pick_folder,
        get_edition_status,
        focus_note_window,
        get_settings,
        save_settings,
        add_custom_terminal,
        remove_custom_terminal,
        pick_terminal_exe,
        resize_note_window,
        get_default_working_directory,
        open_external_url,
        get_system_diagnostics,
        exit_app
    ]);

    let app = app
        .build(tauri::generate_context!())
        .expect("error while running StickyShell Tauri application");

    app.run(|_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event {
            // Keep system tray alive in background when all note windows are closed
            api.prevent_exit();
        }
    });
}
