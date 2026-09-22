# StickyShell Home

A desktop sticky note application that allows you to write notes and run shell commands directly from your desktop. Built with Tauri v2, Rust, and standard web technologies.

---

## Downloads (v1.1.0)

Pre-built binaries are available for Windows, macOS, and Linux:

| Platform | Package | Architecture | Download Link |
| :--- | :--- | :--- | :--- |
| Windows | Setup Installer (.exe) | 64-bit (x64) | [Download Setup (.exe)](../../releases/latest) |
| Windows | MSI Package (.msi) | 64-bit (x64) | [Download MSI (.msi)](../../releases/latest) |
| macOS | Disk Image (.dmg) | Universal (Apple Silicon & Intel) | [Download DMG (.dmg)](../../releases/latest) |
| Linux | Debian Package (.deb) | 64-bit (amd64) | [Download DEB (.deb)](../../releases/latest) |
| Linux | AppImage | 64-bit (x86_64) | [Download AppImage](../../releases/latest) |

You can also find all release files on the [GitHub Releases](../../releases) page.

### Package Managers

#### Scoop (Windows)

Install directly via the manifest URL:
```powershell
scoop install https://raw.githubusercontent.com/RadnusD/stickyshell-home/main/bucket/stickyshell.json
```

---

## Screenshots

| Note Scratchpad | Inline Command Output | Settings & Preferences |
| :---: | :---: | :---: |
| ![Note Scratchpad](docs/screenshots/stickyshell-note.png) | ![Inline Command Output](docs/screenshots/stickyshell-output.png) | ![Settings & Preferences](docs/screenshots/stickyshell-settings.png) |

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

### Windows SmartScreen and Antivirus Detection Context

StickyShell Home is an open-source desktop utility that executes local shell commands on request. Release binaries are not signed with a paid Microsoft Authenticode certificate.

When running newly released binaries on Windows:
- Windows SmartScreen may show an "Unknown Publisher" or "Windows protected your PC" dialog. To run the application, click **More info** and then click **Run anyway**.
- A small number of machine-learning antivirus heuristics may flag the installer because it is unsigned and has the capability to spawn terminal processes (`cmd.exe`, `powershell.exe`).

### VirusTotal Inspection Report

The installer binary has been analyzed on VirusTotal:
- **Scan Report**: [VirusTotal Inspection (SHA-256: abc419496...)](https://www.virustotal.com/gui/file/abc4194960bf53f3da2fa4777a19b5634dc16f572c256216d01eada0252a4e49/)
- **Detection Results**: 68+ security vendors (including Kaspersky, Bitdefender, Malwarebytes, CrowdStrike, SentinelOne, and Symantec) report 0 threats.
- **Heuristic Notes**: The 3 machine-learning flags (such as Sophos "Generic ML PUA") classify unsigned command-execution utilities as Potentially Unwanted Applications (PUA) by policy, not malicious payloads.

StickyShell Home is completely open source and runs 100% offline without network connections or telemetry. You can inspect the source code in this repository or build the binaries from scratch using the build instructions above.

### Code Signing Notice

Free code signing provided by [SignPath.io](https://signpath.io), certificate by [SignPath Foundation](https://signpath.org).

### SHA-256 Checksums (v1.1.0)

| Platform | File | SHA-256 Checksum |
| :--- | :--- | :--- |
| Windows | `StickyShell.Home_1.1.0_x64-setup.exe` | `ABC4194960BF53F3DA2FA4777A19B5634DC16F572C256216D01EADA0252A4E49` |
| Windows | `StickyShell.Home_1.1.0_x64_en-US.msi` | `58026199B00B7719477A707E21CBE88F2B16654A97D0AAEA6978F82C4A08C7C9` |
| macOS | `StickyShell.Home_1.1.0_universal.dmg` | `370F10DE79C7F97B8A65A006CC4F66C1B19ACFF8EFF6C1EA715D13E93C264911` |
| Linux | `StickyShell.Home_1.1.0_amd64.deb` | `D385E762C66E3B2AC31152E1ACB69B8F53D00DFDEE40105CDB7D222CAB7E14F4` |

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
