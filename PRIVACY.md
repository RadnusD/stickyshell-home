# Privacy Policy

**Last Updated: 2026**

StickyShell Home is committed to privacy and local data control.

---

## 1. Offline Operation and Zero Telemetry

StickyShell Home operates entirely offline on your local device:
- No Analytics / Telemetry: StickyShell does not track your app usage, active features, session duration, or personal habits.
- No Background Network Connections: The application makes zero outgoing background network requests.
- No Cloud Sync or Accounts: StickyShell does not require user registration, passwords, or cloud accounts.

---

## 2. Local Data Storage
All your notes, custom folders, UI preferences, and configuration settings are stored exclusively on your local hard drive in standard JSON format:
- **Windows**: %APPDATA%\com.stickyshell.home\stickyshell_data.json
- **macOS**: ~/Library/Application Support/com.stickyshell.home/stickyshell_data.json
- **Linux**: ~/.config/com.stickyshell.home/stickyshell_data.json

Your data remains entirely on your machine and is never transmitted to any external server.

---

## 3. Terminal & Shell Execution Security
When executing shell commands via Inline Capture or External Console modes:
- All commands execute strictly within your local operating system's shell (cmd.exe, powershell.exe, /bin/bash, etc.).
- Output logs and command history are kept in temporary local memory buffers and are never sent over any network.

---

## 4. Third-Party Services
StickyShell Home does not integrate third-party advertising SDKs, tracking pixels, or external analytics providers. 

---

## 5. Contact & Questions
If you have any questions or feedback regarding this Privacy Policy, please open an issue on the official GitHub repository:
- **GitHub**: [https://github.com/RadnusD/stickyshell-home](https://github.com/RadnusD/stickyshell-home)
