# 🛡️ Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We take the security and privacy of **StickyShell Home** very seriously.

If you discover a potential security vulnerability or privacy concern:

1. **Do not create a public issue.**
2. Please report the vulnerability privately via **GitHub Security Advisory** on the official repository:
   - [Report a Security Advisory on GitHub](https://github.com/RadnusD/stickyshell-home/security/advisories/new)
3. Include detailed reproduction steps, proof-of-concept payload, and the affected operating system.

---

## Security Architecture & Local Isolation

StickyShell Home is built with strict privacy and security guarantees:
- **100% Offline**: Zero outgoing telemetry or data collection.
- **Hardened Content Security Policy (CSP)**: Blocks remote script injection and restricts WebView2 connections strictly to local IPC protocols (ipc: and http://tauri.localhost).
- **Subprocess Isolation**: Terminal commands execute strictly in local child processes using explicit argument vector passing to prevent command injection.
