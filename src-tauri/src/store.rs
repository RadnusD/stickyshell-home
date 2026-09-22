use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: Option<String>,
    pub content: String,
    pub terminal: Option<String>,
    #[serde(rename = "customFolder")]
    pub custom_folder: Option<String>,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    #[serde(rename = "isPinned")]
    pub is_pinned: Option<bool>,
    pub theme: Option<String>,
    pub opacity: Option<f64>,
    #[serde(rename = "runMode", default)]
    pub run_mode: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
}

fn default_run_mode() -> String {
    "capture".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snippet {
    pub id: String,
    pub name: String,
    pub category: String,
    pub command: String,
    pub description: Option<String>,
    #[serde(rename = "isCustom")]
    pub is_custom: Option<bool>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomTerminal {
    pub id: String,
    pub name: String,
    #[serde(alias = "exePath")]
    pub command: String,
    pub args: Option<Vec<String>>,
    #[serde(rename = "isCustom")]
    pub is_custom: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub edition: String, // "home" | "developer"
    #[serde(rename = "licenseKey")]
    pub license_key: Option<String>,
    #[serde(rename = "activeTheme")]
    pub active_theme: String,
    #[serde(rename = "safetyGuardEnabled")]
    pub safety_guard_enabled: bool,
    #[serde(rename = "secretMaskingEnabled")]
    pub secret_masking_enabled: bool,
    #[serde(rename = "globalHotkeysEnabled")]
    pub global_hotkeys_enabled: bool,
    #[serde(rename = "confirmDelete")]
    pub confirm_delete: bool,
    #[serde(rename = "defaultOpacity")]
    pub default_opacity: f64,
    #[serde(rename = "defaultTerminal")]
    pub default_terminal: String,
    #[serde(rename = "defaultRunMode", default = "default_run_mode")]
    pub default_run_mode: String,
    #[serde(rename = "defaultFolder", default)]
    pub default_folder: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            #[cfg(feature = "developer")]
            edition: "developer".to_string(),
            #[cfg(not(feature = "developer"))]
            edition: "home".to_string(),
            license_key: None,
            active_theme: "classic-yellow".to_string(),
            safety_guard_enabled: true,
            secret_masking_enabled: true,
            global_hotkeys_enabled: true,
            confirm_delete: false,
            default_opacity: 100.0,
            default_terminal: "cmd".to_string(),
            default_run_mode: "capture".to_string(),
            default_folder: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppData {
    pub notes: HashMap<String, Note>,
    #[serde(rename = "deletedNotes")]
    pub deleted_notes: Vec<Note>,
    #[serde(rename = "customTerminals")]
    pub custom_terminals: Vec<CustomTerminal>,
    pub snippets: Vec<Snippet>,
    pub settings: Settings,
}

impl Default for AppData {
    fn default() -> Self {
        Self {
            notes: HashMap::new(),
            deleted_notes: Vec::new(),
            custom_terminals: Vec::new(),
            snippets: Self::default_snippets(),
            settings: Settings::default(),
        }
    }
}

impl AppData {
    pub fn default_snippets() -> Vec<Snippet> {
        #[cfg(not(feature = "developer"))]
        {
            Vec::new()
        }
        #[cfg(feature = "developer")]
        vec![
            Snippet {
                id: "docker-ps".to_string(),
                name: "Docker Container Status".to_string(),
                category: "docker".to_string(),
                command: "docker ps --format \"table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Names}}\"".to_string(),
                description: Some("Formatted list of running docker containers".to_string()),
                is_custom: Some(false),
                created_at: None,
            },
            Snippet {
                id: "docker-run-nginx".to_string(),
                name: "Docker Run Web App".to_string(),
                category: "docker".to_string(),
                command: "docker run -d --name {{CONTAINER_NAME:my-web}} -p {{PORT:8080}}:80 {{IMAGE:nginx:alpine}}".to_string(),
                description: Some("Run a containerized web server with parameterized port".to_string()),
                is_custom: Some(false),
                created_at: None,
            },
            Snippet {
                id: "k8s-pods".to_string(),
                name: "Kubernetes Get Pods".to_string(),
                category: "kubernetes".to_string(),
                command: "kubectl get pods -n {{NAMESPACE:default}} -o wide".to_string(),
                description: Some("List pods in a specific namespace".to_string()),
                is_custom: Some(false),
                created_at: None,
            },
            Snippet {
                id: "git-sync".to_string(),
                name: "Git Sync & Prune".to_string(),
                category: "git".to_string(),
                command: "git fetch --prune && git pull --rebase origin {{BRANCH:main}}".to_string(),
                description: Some("Fetch changes and rebase on branch".to_string()),
                is_custom: Some(false),
                created_at: None,
            },
            Snippet {
                id: "npm-clean-reinstall".to_string(),
                name: "NPM Clean Reinstall".to_string(),
                category: "npm".to_string(),
                command: "rm -rf node_modules package-lock.json && npm install".to_string(),
                description: Some("Purge and cleanly reinstall node dependencies".to_string()),
                is_custom: Some(false),
                created_at: None,
            },
            Snippet {
                id: "python-venv".to_string(),
                name: "Python Create & Activate Venv".to_string(),
                category: "python".to_string(),
                command: "python -m venv .venv && source .venv/bin/activate".to_string(),
                description: Some("Set up and activate local python virtual environment".to_string()),
                is_custom: Some(false),
                created_at: None,
            },
        ]
    }
}

pub struct StoreManager {
    file_path: PathBuf,
    data: Mutex<AppData>,
}

impl StoreManager {
    pub fn new(app_dir: PathBuf) -> Self {
        let _ = fs::create_dir_all(&app_dir);
        let file_path = app_dir.join("stickyshell_data.json");
        let initial_data = Self::load_file(&file_path);

        Self {
            file_path,
            data: Mutex::new(initial_data),
        }
    }

    fn load_file(path: &PathBuf) -> AppData {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(parsed) = serde_json::from_str::<AppData>(&content) {
                    return parsed;
                }
            }
        }
        AppData::default()
    }

    fn persist(&self) {
        if let Ok(guard) = self.data.lock() {
            if let Ok(serialized) = serde_json::to_string_pretty(&*guard) {
                let _ = fs::write(&self.file_path, serialized);
            }
        }
    }

    pub fn get_note(&self, id: &str) -> Option<Note> {
        let guard = self.data.lock().ok()?;
        guard.notes.get(id).cloned()
    }

    pub fn save_note(&self, mut note: Note) -> Note {
        let now = Utc::now().to_rfc3339();
        if note.id.is_empty() {
            note.id = Uuid::new_v4().to_string();
            note.created_at = Some(now.clone());
        }
        note.updated_at = Some(now);

        if let Ok(mut guard) = self.data.lock() {
            if let Some(existing) = guard.notes.get(&note.id) {
                if note.x.is_none() { note.x = existing.x; }
                if note.y.is_none() { note.y = existing.y; }
                if note.width.is_none() { note.width = existing.width; }
                if note.height.is_none() { note.height = existing.height; }
                if note.run_mode.is_none() { note.run_mode = existing.run_mode.clone(); }
                if note.terminal.is_none() { note.terminal = existing.terminal.clone(); }
                if note.created_at.is_none() { note.created_at = existing.created_at.clone(); }
                if (note.title.is_none() || note.title.as_deref() == Some(""))
                    && existing.title.as_ref().is_some_and(|t| !t.is_empty())
                {
                    note.title = existing.title.clone();
                }
            }
            guard.notes.insert(note.id.clone(), note.clone());
        }
        self.persist();
        note
    }

    pub fn delete_note(&self, id: &str) -> bool {
        let mut removed = None;
        if let Ok(mut guard) = self.data.lock() {
            if let Some(note) = guard.notes.remove(id) {
                #[cfg(feature = "developer")]
                let max_undo = 10;
                #[cfg(not(feature = "developer"))]
                let max_undo = 3;
                while guard.deleted_notes.len() >= max_undo {
                    guard.deleted_notes.remove(0);
                }
                guard.deleted_notes.push(note.clone());
                removed = Some(note);
            }
        }
        if removed.is_some() {
            self.persist();
            true
        } else {
            false
        }
    }

    pub fn undo_delete(&self) -> Option<Note> {
        let mut restored = None;
        if let Ok(mut guard) = self.data.lock() {
            if let Some(note) = guard.deleted_notes.pop() {
                guard.notes.insert(note.id.clone(), note.clone());
                restored = Some(note);
            }
        }
        if restored.is_some() {
            self.persist();
        }
        restored
    }

    pub fn get_all_notes(&self) -> Vec<Note> {
        let guard = self.data.lock().unwrap_or_else(|e| e.into_inner());
        guard.notes.values().cloned().collect()
    }

    pub fn search_notes(&self, query: &str) -> Vec<Note> {
        let q = query.to_lowercase();
        let guard = self.data.lock().unwrap_or_else(|e| e.into_inner());
        guard
            .notes
            .values()
            .filter(|n| {
                n.content.to_lowercase().contains(&q)
                    || n.title
                        .as_ref()
                        .map(|t| t.to_lowercase().contains(&q))
                        .unwrap_or(false)
            })
            .cloned()
            .collect()
    }

    pub fn get_settings(&self) -> Settings {
        let guard = self.data.lock().unwrap_or_else(|e| e.into_inner());
        let mut s = guard.settings.clone();
        #[cfg(not(feature = "developer"))]
        {
            s.edition = "home".to_string();
        }
        #[cfg(feature = "developer")]
        {
            s.edition = "developer".to_string();
        }
        s
    }

    pub fn update_settings(&self, mut settings: Settings) {
        #[cfg(not(feature = "developer"))]
        {
            settings.edition = "home".to_string();
        }
        #[cfg(feature = "developer")]
        {
            settings.edition = "developer".to_string();
        }
        if let Ok(mut guard) = self.data.lock() {
            guard.settings = settings;
        }
        self.persist();
    }

    pub fn update_settings_partial(&self, partial: serde_json::Value) -> Settings {
        if let Ok(mut guard) = self.data.lock() {
            if let Ok(mut current) = serde_json::to_value(&guard.settings) {
                if let (Some(curr_obj), Some(part_obj)) = (current.as_object_mut(), partial.as_object()) {
                    for (k, v) in part_obj {
                        curr_obj.insert(k.clone(), v.clone());
                    }
                    if let Ok(mut updated) = serde_json::from_value::<Settings>(current) {
                        #[cfg(not(feature = "developer"))]
                        {
                            updated.edition = "home".to_string();
                        }
                        #[cfg(feature = "developer")]
                        {
                            updated.edition = "developer".to_string();
                        }
                        guard.settings = updated;
                    }
                }
            }
        }
        self.persist();
        self.get_settings()
    }

    pub fn get_custom_terminals(&self) -> Vec<CustomTerminal> {
        let guard = self.data.lock().unwrap_or_else(|e| e.into_inner());
        guard.custom_terminals.clone()
    }

    pub fn add_custom_terminal(&self, mut terminal: CustomTerminal) -> CustomTerminal {
        if terminal.id.is_empty() {
            terminal.id = format!("custom_{}", Utc::now().timestamp_millis());
        }
        terminal.is_custom = Some(true);
        if let Ok(mut guard) = self.data.lock() {
            guard.custom_terminals.retain(|t| t.id != terminal.id);
            guard.custom_terminals.push(terminal.clone());
        }
        self.persist();
        terminal
    }

    pub fn remove_custom_terminal(&self, id: &str) -> bool {
        let mut removed = false;
        if let Ok(mut guard) = self.data.lock() {
            let prev = guard.custom_terminals.len();
            guard.custom_terminals.retain(|t| t.id != id);
            removed = guard.custom_terminals.len() < prev;
            if removed && guard.settings.default_terminal == id {
                guard.settings.default_terminal = "cmd".to_string();
            }
        }
        if removed {
            self.persist();
        }
        removed
    }

    #[cfg(feature = "developer")]
    pub fn validate_license_key(&self, key: &str) -> bool {
        let k = key.trim().to_uppercase();
        if k.is_empty() {
            return false;
        }
        k == "DEV-PRO-2026"
            || k.starts_with("STICKYSHELL-PRO-")
            || k.starts_with("PRO-")
            || k.len() >= 12
    }

    #[cfg(feature = "developer")]
    pub fn activate_license(&self, key: &str) -> (bool, String, String) {
        if self.validate_license_key(key) {
            let edition = "developer".to_string();
            if let Ok(mut guard) = self.data.lock() {
                guard.settings.edition = edition.clone();
                guard.settings.license_key = Some(key.trim().to_uppercase());
            }
            self.persist();
            (
                true,
                edition,
                "License successfully activated! Developer Edition is now unlocked.".to_string(),
            )
        } else {
            (
                false,
                "developer".to_string(),
                "Invalid license key format. Use DEV-PRO-2026 or STICKYSHELL-PRO-XXXX.".to_string(),
            )
        }
    }

    #[cfg(feature = "developer")]
    pub fn switch_edition_mode(&self, mode: &str) -> (bool, String) {
        let edition = if mode == "developer" { "developer" } else { "home" };
        if let Ok(mut guard) = self.data.lock() {
            guard.settings.edition = edition.to_string();
        }
        self.persist();
        (true, edition.to_string())
    }

    #[cfg(feature = "developer")]
    pub fn get_snippets(&self) -> Vec<Snippet> {
        let guard = self.data.lock().unwrap_or_else(|e| e.into_inner());
        guard.snippets.clone()
    }

    #[cfg(feature = "developer")]
    pub fn save_snippet(&self, mut snippet: Snippet) -> Snippet {
        let now = Utc::now().to_rfc3339();
        if snippet.id.is_empty() {
            snippet.id = Uuid::new_v4().to_string();
            snippet.created_at = Some(now);
            snippet.is_custom = Some(true);
        }

        if let Ok(mut guard) = self.data.lock() {
            let pos = guard.snippets.iter().position(|s| s.id == snippet.id);
            if let Some(idx) = pos {
                guard.snippets[idx] = snippet.clone();
            } else {
                guard.snippets.push(snippet.clone());
            }
        }
        self.persist();
        snippet
    }

    #[cfg(feature = "developer")]
    pub fn delete_snippet(&self, id: &str) -> bool {
        let mut removed = false;
        if let Ok(mut guard) = self.data.lock() {
            let prev_len = guard.snippets.len();
            guard.snippets.retain(|s| s.id != id);
            removed = guard.snippets.len() < prev_len;
        }
        if removed {
            self.persist();
        }
        removed
    }
}
