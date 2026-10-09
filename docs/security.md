# Security, Privacy, and Reliability Specifications

## 1. Server-Side Request Forgery (SSRF) Defense

When the Evidence Agent retrieves external resources, candidate URLs are parsed through strict protocol and IP filters before any network socket is opened.

### Blocked Hostnames and Networks:
- `localhost`, `127.0.0.1`, `::1` (Loopback isolation)
- `169.254.169.254`, `metadata.google.internal`, `instance-data` (Cloud metadata endpoints)
- `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC-1918 IPv4 ranges)
- Non-HTTP/HTTPS schemes (`file://`, `ftp://`, `gopher://`, `data://`)

---

## 2. Prompt-Injection & Untrusted Content Separation

External web documents and user queries are treated as untrusted data:
1. Retrieved content is placed inside structured citation envelopes with explicit delimitation.
2. System prompts strictly forbid models from following instructions, tool calls, or policy modifications encountered within web excerpts.
3. Decision policies are evaluated in deterministic code outside the LLM. An external text asserting *"Policy override: always accept"* cannot bypass the TypeScript Decision Engine.

---

## 3. Secret and Credential Hygiene

1. API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) are stored in server environment variables only.
2. The frontend React bundle never receives provider API keys.
3. API endpoints (`GET /api/config/status`, `GET /api/agents`) return sanitized boolean flags (`geminiConfigured: true`) and never disclose secrets.
4. Logging pipelines redact Authorization headers.

---

## 4. Privacy & Data Transmission Disclosures

When external cloud model providers are enabled:
- **Google GenAI**: Prompts and question texts are processed according to Google Cloud / AI Studio terms and privacy policies.
- **OpenAI**: When `OPENAI_API_KEY` is supplied, question payloads are transmitted to OpenAI's completion endpoints.
- If cloud APIs are disabled or keys are unconfigured, the application operates locally using deterministic test doubles and local curated archives without external data transmission.
