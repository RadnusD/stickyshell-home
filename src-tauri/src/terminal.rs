use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalInfo {
    pub id: String,
    pub name: String,
    pub command: String,
    #[serde(rename = "exePath")]
    pub exe_path: Option<String>,
    #[serde(rename = "type")]
    pub term_type: Option<String>,
    #[serde(rename = "isDefault")]
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    #[serde(rename = "exitCode")]
    pub exit_code: i32,
    #[serde(rename = "durationMs")]
    pub duration_ms: u128,
}

pub fn get_default_working_dir() -> String {
    #[cfg(target_os = "windows")]
    {
        std::env::var("USERPROFILE").unwrap_or_else(|_| ".".to_string())
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("HOME").unwrap_or_else(|_| ".".to_string())
    }
}

pub struct TerminalRunner;

impl TerminalRunner {
    pub fn get_available_terminals() -> Vec<TerminalInfo> {
        #[cfg(target_os = "windows")]
        {
            vec![
                TerminalInfo {
                    id: "cmd".to_string(),
                    name: "Command Prompt".to_string(),
                    command: "cmd.exe".to_string(),
                    exe_path: Some("cmd.exe".to_string()),
                    term_type: Some("builtin".to_string()),
                    is_default: true,
                },
                TerminalInfo {
                    id: "powershell".to_string(),
                    name: "PowerShell".to_string(),
                    command: "powershell.exe".to_string(),
                    exe_path: Some("powershell.exe".to_string()),
                    term_type: Some("builtin".to_string()),
                    is_default: false,
                },
            ]
        }

        #[cfg(target_os = "linux")]
        {
            let mut list = Vec::new();
            if let Ok(term) = std::env::var("TERMINAL") {
                list.push(TerminalInfo {
                    id: term.clone(),
                    name: format!("Default Terminal ({})", term),
                    command: term,
                    exe_path: None,
                    term_type: Some("builtin".to_string()),
                    is_default: true,
                });
            } else {
                list.push(TerminalInfo {
                    id: "gnome-terminal".to_string(),
                    name: "GNOME Terminal".to_string(),
                    command: "gnome-terminal".to_string(),
                    exe_path: None,
                    term_type: Some("builtin".to_string()),
                    is_default: true,
                });
            }
            list.push(TerminalInfo {
                id: "xterm".to_string(),
                name: "XTerm".to_string(),
                command: "xterm".to_string(),
                exe_path: None,
                term_type: Some("builtin".to_string()),
                is_default: false,
            });
            list
        }

        #[cfg(target_os = "macos")]
        {
            vec![
                TerminalInfo {
                    id: "terminal".to_string(),
                    name: "Terminal.app".to_string(),
                    command: "Terminal".to_string(),
                    exe_path: None,
                    term_type: Some("builtin".to_string()),
                    is_default: true,
                },
                TerminalInfo {
                    id: "iterm".to_string(),
                    name: "iTerm2".to_string(),
                    command: "iTerm".to_string(),
                    exe_path: None,
                    term_type: Some("builtin".to_string()),
                    is_default: false,
                },
            ]
        }
    }

    pub fn run_in_external_terminal(
        terminal_id: &str,
        command: &str,
        working_dir: Option<&str>,
    ) -> Result<(), String> {
        let default_dir = get_default_working_dir();
        let mut target_dir = working_dir.unwrap_or(&default_dir);
        if !std::path::Path::new(target_dir).exists() {
            target_dir = &default_dir;
        }

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NEW_CONSOLE: u32 = 0x00000010;

            match terminal_id {
                "powershell" => {
                    let mut cmd = Command::new("powershell.exe");
                    cmd.current_dir(target_dir);
                    cmd.creation_flags(CREATE_NEW_CONSOLE);
                    cmd.args(["-NoExit", "-Command", command]);
                    cmd.spawn()
                        .map_err(|e| format!("Failed to spawn PowerShell: {}", e))?;
                }
                "wt" => {
                    let mut cmd = Command::new("wt.exe");
                    cmd.current_dir(target_dir);
                    cmd.args(["-d", target_dir, "powershell", "-NoExit", "-Command", command]);
                    cmd.spawn()
                        .map_err(|e| format!("Failed to spawn Windows Terminal: {}", e))?;
                }
                _ => {
                    // Default cmd.exe
                    let mut cmd = Command::new("cmd.exe");
                    cmd.current_dir(target_dir);
                    cmd.creation_flags(CREATE_NEW_CONSOLE);
                    cmd.args(["/k", command]);
                    cmd.spawn()
                        .map_err(|e| format!("Failed to spawn CMD: {}", e))?;
                }
            }
        }

        #[cfg(target_os = "linux")]
        {
            let term = if terminal_id.is_empty() || terminal_id == "default" {
                std::env::var("TERMINAL").unwrap_or_else(|_| "x-terminal-emulator".to_string())
            } else {
                terminal_id.to_string()
            };

            match term.as_str() {
                "kitty" | "alacritty" | "wezterm" => {
                    Command::new(&term)
                        .args([
                            "--working-directory",
                            target_dir,
                            "-e",
                            "bash",
                            "-c",
                            &format!("{}; exec bash", command),
                        ])
                        .spawn()
                        .map_err(|e| e.to_string())?;
                }
                "gnome-terminal" | "konsole" | "xfce4-terminal" => {
                    Command::new(&term)
                        .args([
                            "--working-directory",
                            target_dir,
                            "--",
                            "bash",
                            "-c",
                            &format!("{}; exec bash", command),
                        ])
                        .spawn()
                        .map_err(|e| e.to_string())?;
                }
                _ => {
                    Command::new("sh")
                        .args([
                            "-c",
                            &format!(
                                "cd '{}' && xterm -e 'bash -c \"{}; exec bash\"'",
                                target_dir, command
                            ),
                        ])
                        .spawn()
                        .map_err(|e| e.to_string())?;
                }
            }
        }

        #[cfg(target_os = "macos")]
        {
            let applescript = format!(
                "tell application \"Terminal\" to do script \"cd '{}' && {}\"",
                target_dir,
                command.replace('"', "\\\"")
            );
            Command::new("osascript")
                .args(["-e", &applescript])
                .spawn()
                .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn execute_and_capture(
        terminal_id: &str,
        command: &str,
        working_dir: Option<&str>,
    ) -> Result<ExecutionResult, String> {
        let start = Instant::now();
        let default_dir = get_default_working_dir();
        let mut target_dir = working_dir.unwrap_or(&default_dir);
        if !std::path::Path::new(target_dir).exists() {
            target_dir = &default_dir;
        }

        #[cfg(target_os = "windows")]
        {
            let output = if terminal_id == "powershell" {
                let mut cmd = Command::new("powershell.exe");
                cmd.current_dir(target_dir);
                cmd.args([
                    "-NoProfile",
                    "-NonInteractive",
                    "-Command",
                    command,
                ])
                .output()
                .map_err(|e| e.to_string())?
            } else {
                let mut cmd = Command::new("cmd.exe");
                cmd.current_dir(target_dir);
                cmd.args(["/c", command])
                    .output()
                    .map_err(|e| e.to_string())?
            };

            let duration_ms = start.elapsed().as_millis();
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let exit_code = output.status.code().unwrap_or(0);

            Ok(ExecutionResult {
                stdout,
                stderr,
                exit_code,
                duration_ms,
            })
        }

        #[cfg(not(target_os = "windows"))]
        {
            let output = Command::new("bash")
                .args(["-c", &format!("cd '{}' && {}", target_dir, command)])
                .output()
                .map_err(|e| e.to_string())?;

            let duration_ms = start.elapsed().as_millis();
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let exit_code = output.status.code().unwrap_or(0);

            Ok(ExecutionResult {
                stdout,
                stderr,
                exit_code,
                duration_ms,
            })
        }
    }
}
