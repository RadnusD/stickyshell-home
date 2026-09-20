# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.1.x   | Yes       |
| 1.0.x   | Yes       |
| < 1.0   | No        |

---

## Reporting a Vulnerability

If you discover a security vulnerability or privacy concern:

1. Do not create a public issue.
2. Report the vulnerability privately through GitHub Security Advisories:
   - [Report a Security Advisory on GitHub](https://github.com/RadnusD/stickyshell-home/security/advisories/new)
3. Provide details on how to reproduce the issue, along with the affected operating system.

---

## Security Architecture

StickyShell Home is designed with security and privacy in mind:
- 100% Offline: No outgoing telemetry, tracking, or network calls.
- Content Security Policy (CSP): Blocks remote scripts and restricts WebView2 connections strictly to local IPC protocols (`ipc:` and `http://tauri.localhost`).
- Subprocess Isolation: Terminal commands run locally as child processes using explicit argument vectors.
