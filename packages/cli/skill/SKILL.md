---
name: mail59pk
description: Use when an AI agent needs a temporary/disposable email address — for receiving verification emails, testing email integrations, or any task requiring a temporary inbox via the mail59pk CLI
---

# mail.59pk.net — Temporary Email for AI Agents

## Overview
mail.59pk.net provides disposable email addresses with an agent-first CLI (`mail59pk`). Create inboxes, wait for messages, read content, and send emails programmatically.

## Install

Install the mail.59pk.net CLI globally when it is not already available:

```bash
npm i -g @mail59pk/cli
```

Then confirm the binary is available:

```bash
mail59pk --help
```

## Setup

Configure once per environment:
```bash
mail59pk config set api-url https://mail.59pk.net
mail59pk config set api-key YOUR_API_KEY
```

Or via environment variables: `MAIL59PK_API_URL`, `MAIL59PK_API_KEY`.

## Core Workflow: Receive an Email

```bash
# 1. Create inbox — capture ONCE, parse both fields
RESULT=$(mail59pk --json create --expiry 1h)
ID=$(echo "$RESULT" | jq -r '.id')
EMAIL=$(echo "$RESULT" | jq -r '.address')

# 2. Use $EMAIL wherever needed (registration, forms, etc.)

# 3. Wait for message (exits when message arrives or times out)
MSG=$(mail59pk --json wait --email-id "$ID" --timeout 120)
MSG_ID=$(echo "$MSG" | jq -r '.messageId')

# 4. Read full message content
mail59pk --json read --email-id "$ID" --message-id "$MSG_ID"
```

## Command Reference

| Command | Required Options | Notable Options |
|---------|-----------------|-----------------|
| `config set` | `<key> <value>` | keys: `api-url`, `api-key` |
| `create` | — | `--name`, `--domain`, `--expiry` (1h\|24h\|3d\|permanent) |
| `list` | — | `--email-id` (lists messages in mailbox), `--cursor` |
| `wait` | `--email-id` | `--timeout` (default 120s), `--interval` (default 5s) |
| `read` | `--email-id`, `--message-id` | `--format` (text\|html) |
| `send` | `--email-id`, `--to`, `--subject`, `--content` | — |
| `delete` | `--email-id` | — |

**`--json` is a global flag — it works before or after the subcommand:**
```bash
mail59pk --json create --expiry 24h   # both work
mail59pk create --expiry 24h --json
```

## JSON Output Shapes

**create:** `{ "id": "...", "address": "user@domain.com", "expiresAt": "2025-..." }`

**wait:** `{ "messageId": "...", "from": "...", "subject": "...", "receivedAt": "2025-..." }`

**read:** `{ "id": "...", "from": "...", "to": "...", "subject": "...", "content": "plain text", "html": "...", "receivedAt": "..." }`

**send:** `{ "success": true, "remainingEmails": 10 }`

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling `create` twice to get id + address | Call once, save to variable, parse both fields |
| Timeout too short for slow services | Use `--timeout 300` for unreliable senders |
| Inbox expired mid-test | Use `--expiry permanent` for long-running workflows |
| Using `content` field for HTML emails | Check both `content` (plain text) and `html` fields |
