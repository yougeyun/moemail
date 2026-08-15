# mail.59pk.net

Temporary email service powered by Cloudflare Pages, D1 and KV, with a matching WeChat Mini Program, SMTP mail relay, web UI themes, CLI and MCP tools.

## Features

- Create temporary mailboxes with configurable expiry: 1 hour, 1 day, 3 days or permanent
- Unified mailbox UI with real-time polling, pagination and CSV export
- Activation-code quota system for mailbox count and sending count
- Customizable member levels with per-level domain, expiry and sending rules
- Site branding: title, description, keywords, logo and favicon
- Multiple UI templates that can coexist and be switched from the admin panel
- WeChat Mini Program with login/binding, unified inbox, send tab and rewarded ads
- SMTP relay for system verification emails and user-sent emails
- API keys plus CLI/MCP for agent and programmatic access
- Rate limiting on sensitive endpoints (registration, verification, redemption, batch creation)

## Project Structure

```text
app/          Next.js web application and API routes
miniprogram/  WeChat Mini Program
templates/    UI template themes
workers/      Email receiver and cleanup workers
mail-relay/   PHP SMTP relay
packages/     CLI, MCP and shared core packages
drizzle/      D1 database migrations
scripts/      Deployment and maintenance scripts
```

## Deployment

The project deploys through GitHub Actions to Cloudflare Pages, with D1 migrations run automatically.

### Repository secrets

Add the following secrets to the GitHub repository:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `PROJECT_NAME` (optional, default is `moemail`)
- `DATABASE_NAME` (optional)
- `DATABASE_ID` (optional)
- `KV_NAMESPACE_NAME` (optional)
- `KV_NAMESPACE_ID` (optional)
- `CUSTOM_DOMAIN` (optional)
- `AUTH_SECRET`

### Trigger a deployment

Push a version tag or run the workflow manually:

```bash
git tag v0.9.1
git push origin v0.9.1
```

The workflow builds the site, creates or updates the Cloudflare resources and applies D1 migrations before deploying.

## SMTP Relay

Cloudflare Edge cannot use Node SMTP libraries directly, so outgoing email goes through a small PHP relay.

1. Upload `mail-relay/send.php` and `mail-relay/config.php` to a PHP host.
2. Fill in your SMTP host, port, account and authorization code in `config.php`.
3. Set `RELAY_TOKEN` to a long random string.
4. In the admin panel under Email, configure System Mail with the relay HTTPS URL and token.
5. Enable Email Service so temporary mailbox sending uses the same relay.

QQ Mail uses `smtp.qq.com` on port `465`; NetEase Mail uses `smtp.163.com` on port `465`. Both require an SMTP authorization code rather than the account password.

## WeChat Mini Program

The Mini Program is in `miniprogram/`. Open it with WeChat Developer Tools using the project AppID.

Before publishing:

- Configure AppID and AppSecret in the admin panel under WeChat
- Add `mail.59pk.net` to the Mini Program request domain whitelist
- Configure ad unit IDs in the admin panel if ads are enabled
- Configure the subscribe message template ID for new-email notifications
- Upload, submit and release a new version after backend changes

## Admin Panel

The admin panel is available from the profile page and includes:

- Website: site settings, branding, TDK, logo, favicon and template switching
- Members: create, edit and delete member levels and configure permissions
- Users: search users and change their member level
- Activation codes: batch generate codes with mailbox/sending quotas and expiry
- Email: sending service and system mail SMTP relay
- WeChat: Mini Program login, subscribe messages and ads
- Navigation: edit Mini Program tab names and visibility
- Developer: webhooks and API keys

## CLI and MCP

The CLI is published as `@mail59pk/cli` and the MCP server as `@mail59pk/mcp`.

```bash
npm i -g @mail59pk/cli
mail59pk config set api-url https://mail.59pk.net
mail59pk config set api-key YOUR_API_KEY
mail59pk create --expiry 1h
mail59pk wait --email-id <id> --timeout 120
mail59pk read --email-id <id> --message-id <message_id>
```

Environment variables `MAIL59PK_API_URL` and `MAIL59PK_API_KEY` can replace file configuration.

## DNS Records

For better deliverability, add SPF and DMARC records for the sending domain:

```text
TXT  @  v=spf1 include:spf.mail.qq.com -all
TXT  _dmarc  v=DMARC1; p=none; rua=mailto:postmaster@mail.59pk.net
```

Adjust the SPF include to match the SMTP provider actually used. If Cloudflare Email Routing is also enabled, include its SPF record as well. DKIM keys depend on the sending provider; configure them where the provider exposes them.

## License

MIT
