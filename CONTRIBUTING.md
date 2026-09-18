# 🤝 Contributing to StickyShell Home

Thank you for your interest in improving StickyShell Home! We welcome bug reports, documentation updates, and feature discussions.

---

## 🐞 Reporting Bugs

Before reporting a bug, please search existing issues to see if it has already been reported.

When opening an issue, please use our [Bug Report Form](https://github.com/RadnusD/stickyshell-home/issues/new?template=bug_report.yml) and include:
- Operating system (Windows 10/11, macOS, Ubuntu/Debian, Fedora).
- StickyShell version (e.g. 1.0.0).
- Clear reproduction steps.
- Output from the **Copy Diagnostics** button in Settings -> About.

---

## 💡 Proposing Features

Have an idea to make StickyShell even better? Please open a [Feature Request Form](https://github.com/RadnusD/stickyshell-home/issues/new?template=feature_request.yml) explaining:
- The problem you are trying to solve.
- Your proposed solution or workflow.
- Any alternative ideas you have considered.

---

## 🛠️ Local Development & Building

### Prerequisites:
- **Node.js** (v18+)
- **Rust** (stable toolchain)
- **C++ Build Tools** (MSVC on Windows, Xcode on macOS, GTK/WebKit on Linux)

### Setup Instructions:
1. Clone the repository:
   ```bash
   git clone https://github.com/RadnusD/stickyshell-home.git
   cd stickyshell-home
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```
4. Run test suites:
   ```bash
   npm test
   cargo check --manifest-path src-tauri/Cargo.toml
   ```
5. Build production binary:
   ```bash
   npm run build
   ```
