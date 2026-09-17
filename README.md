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

## 📥 Downloads (Version 1.0.0)

Download the official release for your operating system:

| Platform | Package | Architecture | Download Link |
| :--- | :--- | :--- | :--- |
| **Windows** | **Setup Installer (`.exe`)** | 64-bit (x64) | [**Download Setup (.exe)**](../../releases/latest) |
| **Windows** | **Enterprise Package (`.msi`)** | 64-bit (x64) | [**Download MSI (.msi)**](../../releases/latest) |
| **Windows** | **Portable Binary (`.exe`)** | 64-bit (x64) | [**Download Portable (.exe)**](../../releases/latest) |
| **macOS** | **Disk Image (`.dmg`)** | Universal (Apple Silicon & Intel) | [**Download DMG (.dmg)**](../../releases/latest) |
| **Linux** | **Debian Package (`.deb`)** | 64-bit (amd64) | [**Download DEB (.deb)**](../../releases/latest) |
| **Linux** | **Standalone AppImage** | 64-bit (x86_64) | [**Download AppImage**](../../releases/latest) |

*All installation files are also available on the official [**GitHub Releases**](../../releases) page.*

---

## 🌟 What is StickyShell?

**StickyShell Home** combines the everyday convenience of sticky notes with the utility of an instant command-line scratchpad. 

Whether you are saving quick snippets, drafting code, or running diagnostics, StickyShell lets you execute commands right from your sticky note without ever breaking your workflow or managing multiple terminal windows.

---

## ✨ Features

- 💻 **Dual Execution Modes**:
  - **Inline Capture (`▶`)**: Captures output and errors in a slide-out drawer with one-click copy.
  - **External Console (`👁`)**: Opens an interactive system console (CMD or PowerShell) for interactive workflows.
- 📌 **Always on Top (Pinning)**: Keep your active note floating above other windows with a single click.
- 🛡️ **Accidental Delete Protection**:
  - Optional **"Confirm Before Deleting Notes"** safety prompt.
  - Persistent **Undo Delete Buffer**: Restore closed or deleted notes with `Ctrl+Z`, even after restarting your computer.
- ⚡ **Global Shortcuts**:
  - `Win + Alt + S`: Show or hide all sticky notes instantly.
  - `Win + Alt + N`: Spawn a new note at any time.
- 📂 **Custom Working Folders**: Set per-note working directories, or fall back to your user home profile.
- 🔒 **100% Offline & Private**: Zero cloud sync, zero tracking, zero accounts. All notes and settings are stored locally on your machine in standard JSON format.

---

## 🖥️ Installation Guide

### Windows
1. Download `StickyShell Home_1.0.0_x64-setup.exe`.
2. Run the installer and follow the setup wizard.
3. Launch **StickyShell Home** from your Desktop or Start Menu.

### macOS
1. Download `StickyShell Home_1.0.0_universal.dmg`.
2. Open the disk image and drag **StickyShell Home** into your **Applications** folder.
3. Open the app from Applications or Spotlight.

### Linux
- **Debian / Ubuntu**:
  ```bash
  sudo dpkg -i stickyshell-home_1.0.0_amd64.deb
  ```
- **AppImage**:
  ```bash
  chmod +x stickyshell-home_1.0.0_amd64.AppImage
  ./stickyshell-home_1.0.0_amd64.AppImage
  ```

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Win + Alt + S` | Toggle (Show/Hide) all sticky notes |
| `Win + Alt + N` | Create a new sticky note |
| `Ctrl + Enter` | Run command (Inline Capture mode) |
| `Ctrl + Shift + Enter` | Run command (External Console mode) |
| `Ctrl + Z` | Undo note deletion (from 3-dot menu or shortcut) |

---

## 🔒 Privacy & Local Storage

StickyShell respects your complete privacy:
- **No telemetry or analytics.**
- **No cloud connections.**
- All notes and configuration are stored locally on your hard drive:
  - **Windows**: `%APPDATA%\com.stickyshell.home\stickyshell_data.json`
  - **macOS**: `~/Library/Application Support/com.stickyshell.home/stickyshell_data.json`
  - **Linux**: `~/.config/com.stickyshell.home/stickyshell_data.json`

---

## 💬 Feedback & Support

Encountered a bug or have a suggestion?
- Open an issue on our [**Issues Tracker**](../../issues).

---

## 📄 License & Copyright

**Copyright © 2026 StickyShell. All rights reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, modification, reverse engineering, decompilation, or disassembly of this software or its binaries is strictly prohibited.
