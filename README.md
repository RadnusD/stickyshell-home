# StickyShell Home

A lightweight desktop sticky note application that allows you to write notes and run shell commands directly from your desktop. Built with Tauri v2, Rust, and standard web technologies.

---

## Downloads (v1.1.0)

Pre-built binaries are available for Windows, macOS, and Linux:

| Platform | Package | Architecture | Download Link |
| :--- | :--- | :--- | :--- |
| Windows | Setup Installer (.exe) | 64-bit (x64) | [Download Setup (.exe)](../../releases/latest) |
| Windows | MSI Package (.msi) | 64-bit (x64) | [Download MSI (.msi)](../../releases/latest) |
| Windows | Standalone (.exe) | 64-bit (x64) | [Download Standalone (.exe)](../../releases/latest) |
| macOS | Disk Image (.dmg) | Universal (Apple Silicon & Intel) | [Download DMG (.dmg)](../../releases/latest) |
| Linux | Debian Package (.deb) | 64-bit (amd64) | [Download DEB (.deb)](../../releases/latest) |
| Linux | AppImage | 64-bit (x86_64) | [Download AppImage](../../releases/latest) |

You can also find all release files on the [GitHub Releases](../../releases) page.

---

## Features

- Multi-Line Block Execution: Run single commands or multi-line shell scripts directly from your note.
- Dual Execution Modes:
  - Inline Capture (Ctrl + Enter): Runs commands quietly and captures stdout/stderr in an expandable output drawer.
  - External Console (Ctrl + Shift + Enter): Opens a native interactive terminal window (CMD, PowerShell, or Bash).
- Always on Top: Pin any note to keep it floating above other active windows.
- Custom Working Directories: Configure specific working directories per note, or default to your user profile directory.
- Start on Startup: Optional toggle in settings to launch StickyShell when your computer boots.
- 100% Offline: Notes and settings are stored locally on your machine in standard JSON format. No cloud sync, no tracking, and no external network calls.

---

## Building from Source

If you prefer to inspect the source code and compile the application yourself, you can build it in a few steps.

### Prerequisites

- Node.js (version 18 or higher)
- Rust and Cargo (latest stable release from https://rustup.rs)
- Platform-specific build tools:
  - Windows: Visual Studio C++ Build Tools and WebView2 (pre-installed on Windows 10/11)
  - Linux: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - macOS: Xcode Command Line Tools (`xcode-select --install`)

### Build Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/RadnusD/stickyshell-home.git
   cd stickyshell-home
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Compile production binaries and installers:
   ```bash
   npm run build
   ```

The compiled binaries and installer packages will be located in:
`src-tauri/target/release/bundle/`

---

## Antivirus and Safety Information

### Why might Windows SmartScreen or antivirus software flag new builds?

StickyShell Home is an open-source desktop application that executes local shell commands upon user request. Because official code signing certificates for individual developers are prohibitively expensive, release binaries are not signed with a Microsoft Authenticode certificate.

As a result:
- Windows SmartScreen may show an "Unknown Publisher" or "Windows protected your PC" warning.
- Some antivirus heuristics may flag unsigned executables that have the capability to launch terminal processes.

The full source code of StickyShell is open for inspection. You can review every line of code in this repository, check the file hashes below, or build the application from source using the instructions above.

### SHA-256 Checksums (v1.1.0)

| File | SHA-256 Checksum |
| :--- | :--- |
| `StickyShell Home_1.0.0_x64-setup.exe` | `787C8566A7730DE8EDB840C9600EF436960BDF8CB85A894E7C6E7CE7296589DD` |
| `stickyshell-home.exe` | `4366263586D0C34B89B39366B81A625E7C9310A20F57F07A1B8B9AA746EAD1BF` |
| `StickyShell Home_1.0.0_x64_en-US.msi` | `81033BB670F51E27767DBFB5E805D850B49A20205732CAE6F9BFAD17C64376FF` |

You can independently upload and verify any release binary on [VirusTotal](https://www.virustotal.com/gui/home/upload).

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| Win + Alt + S | Show or hide all sticky notes |
| Win + Alt + N | Create a new sticky note |
| Ctrl + Enter | Run note content (Inline Capture) |
| Ctrl + Shift + Enter | Run note content (External Console) |

---

## Local Storage Locations

All user notes and application settings are kept entirely on your local machine:

- Windows: `%APPDATA%\com.stickyshell.home\stickyshell_data.json`
- macOS: `~/Library/Application Support/com.stickyshell.home/stickyshell_data.json`
- Linux: `~/.config/com.stickyshell.home/stickyshell_data.json`

---

## StickyShell Pro (In Development)

A Pro edition of StickyShell is currently under active development. Upcoming features include multi-tab notes, persistent session management, environment variable presets, and customizable hotkey macros.

---

## Support and Feedback

If you encounter an issue or have a suggestion:
- Check existing discussions or submit a report on our [Issues Tracker](../../issues).

---

## License

Copyright (c) 2026 StickyShell / RadnusD. All rights reserved.
See [LICENSE](LICENSE) for details.
