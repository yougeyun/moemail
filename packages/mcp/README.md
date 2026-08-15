# @mail59pk/mcp

MCP (Model Context Protocol) server for [mail.59pk.net](https://mail.59pk.net) — gives any
MCP-capable agent (Claude Desktop, Cursor, Cline, …) native tools for temporary
email: create a mailbox, wait for a verification email, read it, send, and clean up.

It shares the same HTTP client and config as `@mail59pk/cli` via `@mail59pk/core`, so
it talks to the exact same mail.59pk.net API (authenticated with an `X-API-Key`).

## Tools

| Tool | Description |
|------|-------------|
| `create_email` | Create a temporary mailbox (`expiry`: `1h` / `24h` / `3d` / `permanent`) |
| `list_emails` | List mailboxes owned by the API key |
| `list_messages` | List messages in a mailbox |
| `read_message` | Read full text/HTML of a message |
| `wait_for_email` | Poll for a new message (bounded, max 90s; returns `status: "timeout"` to retry) |
| `send_email` | Send from a temporary address (needs send permission) |
| `delete_email` | Delete a mailbox |
| `delete_message` | Delete a single message |

## Configuration

The server reads credentials from environment variables:

- `MAIL59PK_API_KEY` (required) — your mail.59pk.net API key
- `MAIL59PK_API_URL` (optional) — defaults to `https://mail.59pk.net`

## Usage

Add to your MCP client config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mail59pk": {
      "command": "npx",
      "args": ["-y", "@mail59pk/mcp"],
      "env": {
        "MAIL59PK_API_KEY": "mk_xxx",
        "MAIL59PK_API_URL": "https://mail.59pk.net"
      }
    }
  }
}
```

## Notes

- API keys authenticate against `/api/emails*` and `/api/config*` — the same surface
  the CLI uses.
- Authentication, permission, and rate-limit failures from the server are surfaced as
  descriptive tool errors rather than generic failures.
