# 📌 StickyShell Home

<p align="center">
  <strong>A lightweight, cross-platform desktop sticky note that doubles as an executable shell scratchpad.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg" alt="Platform Support" />
  <img src="https://img.shields.io/badge/built%20with-Tauri%20v2%20%2B%20Rust-orange.svg" alt="Tauri v2 + Rust" />
  <img src="https://img.shields.io/badge/privacy-100%25%20Offline-green.svg" alt="100% Offline" />
  <img src="https://img.shields.io/badge/license-Proprietary-red.svg" alt="License" />
</p>

---

## 🌟 Overview

**StickyShell Home** blends the familiar simplicity of desktop sticky notes with the power of an interactive terminal scratchpad. Write quick thoughts, draft command-line snippets, and execute them directly from the note without constantly switching windows or losing focus.

Designed with **Rust** and **Tauri v2**, StickyShell uses minimal system resources (< 35 MB RAM), launches in milliseconds, and operates **100% offline** with zero telemetry or cloud dependencies.

---

## ✨ Key Features

- 💻 **Inline & External Execution**: Run shell commands directly from your note.
  - **Inline Capture Mode (`▶`)**: Captures standard output and error in an integrated drawer with one-click copy.
  - **External Console Mode (`👁`)**: Spawns an external interactive terminal window (CMD or PowerShell) keeping the console open for continuous interaction.
- 📌 **Always on Top (Pinning)**: Pin any note above all other OS windows with a single click.
- 🛡️ **Delete Safety & Undo Buffer**:
  - Optional **"Confirm Before Deleting Notes"** prompt prevents accidental losses.
  - Persistent **Undo Delete buffer**: Restore closed or deleted notes even after computer reboots.
- ⚡ **Global Keyboard Shortcuts**:
  - `Win + Alt + S`: Instantly toggle (show/hide) all open notes.
  - `Win + Alt + N`: Summon a fresh sticky note on your screen.
- 📂 **Custom Working Directories**: Assign specific working folders per note, or default to your user home directory.
- 🔒 **100% Local & Private**: All notes, undo history, and settings are saved locally on your device in standard JSON format (`stickyshell_data.json`). No accounts, no servers, zero telemetry.

---

## 🚀 Downloads & Installers

Pre-built binaries and installers for all major platforms:

| Platform | Package Format | Description |
| :--- | :--- | :--- |
| **Windows** | [`.exe` Setup Installer](src-tauri/target/release/bundle/nsis/StickyShell%20Home_1.0.0_x64-setup.exe) | Standard NSIS Windows Setup Wizard with Desktop & Start Menu shortcuts |
| **Windows** | [`.msi` Package](src-tauri/target/release/bundle/msi/StickyShell%20Home_1.0.0_x64_en-US.msi) | Enterprise-grade Windows Installer |
| **Windows** | [Standalone `.exe`](src-tauri/target/release/stickyshell-home.exe) | Portable standalone executable (no installation required) |
| **macOS** | `.dmg` Installer | Universal DMG (supports Apple Silicon M1/M2/M3/M4 & Intel x86_64) |
| **Linux** | `.deb` Package | Debian / Ubuntu installer package |
| **Linux** | `.AppImage` | Portable universal Linux binary (run with `chmod +x`) |

---

## 🛠️ Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust & Cargo](https://rustup.rs/) (v1.75 or higher)
- C++ build tools:
  - **Windows**: Microsoft Visual Studio C++ Build Tools with WebView2
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Ubuntu/Debian)**:
    ```bash
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf build-essential
    ```

### Clone & Install

```bash
git clone https://github.com/RadnusD/stickyshell-home.git
cd stickyshell-home
npm install
```

### Development Mode

Run the app locally with hot-reloading:

```bash
npm run dev
```

### Production Release Build

Compile the optimized, hardened release binaries and installers:

```bash
npm run build
```

The output packages will be located in:
- Windows: `src-tauri/target/release/bundle/nsis/` and `msi/`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/deb/` and `appimage/`

---

## ☁️ Cross-Platform Cloud Builds (GitHub Actions)

This repository includes an automated multi-platform CI/CD workflow at [`.github/workflows/build-cross-platform.yml`](.github/workflows/build-cross-platform.yml).

Whenever you push to `main` or trigger a build via the **Actions** tab on GitHub:
1. Native runners (`macos-latest`, `ubuntu-22.04`, `windows-latest`) compile simultaneously in the cloud.
2. Production packages (`.dmg`, `.deb`, `.AppImage`, `.exe`, `.msi`) are automatically uploaded as downloadable release artifacts.

---

## 🔐 Security & Binary Hardening

StickyShell Home is engineered with multiple layers of client-side protection:

- **Link-Time Optimization (LTO)**: Whole-program optimization merging crate boundaries.
- **Symbol Stripping**: Release profiles remove all debug tables, variable names, and line numbers (`strip = true`).
- **Panic Abort**: Prevents stack unwinding and scrubs developer system file paths from binary logs (`panic = "abort"`).
- **Anti-Inspection Guards**: Blocks webview DevTools shortcuts (`F12`, `Ctrl+Shift+I`) and context-menu inspection in production.

---

## 📁 Data Storage Location

All configuration and note history is stored in a clean local JSON file:

- **Windows**: `%APPDATA%\com.stickyshell.home\stickyshell_data.json`
- **macOS**: `~/Library/Application Support/com.stickyshell.home/stickyshell_data.json`
- **Linux**: `~/.config/com.stickyshell.home/stickyshell_data.json`

---

## 📄 License & Copyright

Copyright © 2026 StickyShell. Developed by **RadnusD**. All rights reserved.
