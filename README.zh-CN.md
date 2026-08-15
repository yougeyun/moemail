# mail.59pk.net

基于 Cloudflare Pages、D1 和 KV 的临时邮箱服务，配套微信小程序、SMTP 邮件中转、多套网页模板、CLI 和 MCP 工具。

## 功能特性

- 创建临时邮箱，有效期支持 1 小时、1 天、3 天或永久
- 统一邮箱界面，实时轮询、分页加载、邮箱列表导出 CSV
- 激活码兑换体系，可分别控制邮箱数量和发信次数
- 自定义会员等级，按等级配置可用域名、邮箱有效期、每日发信上限
- 网站品牌设置：标题、描述、关键词、Logo 和网站图标
- 多套模板共存，管理后台随时切换
- 微信小程序：登录绑定、统一收件箱、发件页、激励视频广告
- SMTP 中转发送系统验证邮件和用户发信
- API Key、CLI、MCP，供程序化和 AI Agent 调用
- 对注册、验证码、兑换、批量创建等接口加入频率限制

## 项目结构

```text
app/          Next.js 网页应用和 API 路由
miniprogram/  微信小程序
templates/    网页模板主题
workers/      邮件接收和清理 Worker
mail-relay/   PHP SMTP 中转
packages/     CLI、MCP 和公共核心包
drizzle/      D1 数据库迁移
scripts/      部署和维护脚本
```

## 部署方式

项目通过 GitHub Actions 部署到 Cloudflare Pages，D1 迁移会在部署流程中自动执行。

### 仓库 Secrets

在 GitHub 仓库中配置以下 Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `PROJECT_NAME`（可选，默认 `moemail`）
- `DATABASE_NAME`（可选）
- `DATABASE_ID`（可选）
- `KV_NAMESPACE_NAME`（可选）
- `KV_NAMESPACE_ID`（可选）
- `CUSTOM_DOMAIN`（可选）
- `AUTH_SECRET`

### 触发部署

推送 `v*` 标签或手动运行 Workflow：

```bash
git tag v0.9.1
git push origin v0.9.1
```

Workflow 会构建站点、创建或更新 Cloudflare 资源、执行 D1 迁移并完成部署。

## SMTP 邮件中转

Cloudflare Edge 无法直接使用 Node SMTP 库，因此发信通过一个 PHP 中转接口完成。

1. 将 `mail-relay/send.php` 和 `mail-relay/config.php` 上传到 PHP 主机。
2. 在 `config.php` 中填写 SMTP 地址、端口、账号和授权码。
3. 将 `RELAY_TOKEN` 设置为足够长的随机字符串。
4. 在后台“邮件服务”页面配置“系统邮件”的中转地址和密钥。
5. 开启“发件服务”，用户从临时邮箱发信时也走同一套 SMTP 中转。

QQ 邮箱使用 `smtp.qq.com`、端口 `465`；网易邮箱使用 `smtp.163.com`、端口 `465`。两者都需要使用 SMTP 授权码，而不是登录密码。

## 微信小程序

小程序源码位于 `miniprogram/`，使用微信开发者工具打开并填入项目 AppID。

发布前需要：

- 在后台“微信与广告”中配置 AppID 和 AppSecret
- 在小程序后台把 `mail.59pk.net` 加入 request 合法域名
- 开启广告时配置广告位 ID
- 配置新邮件提醒的订阅消息模板 ID
- 后端每次更新后重新上传、提交审核并发布

## 管理后台

个人中心进入管理后台后，分为以下栏目：

- 网站：网站设置、品牌信息、TDK、Logo、图标和模板切换
- 会员等级：新增、删除等级，配置各等级权限
- 用户：搜索用户并调整会员等级
- 激活码：批量生成激活码，设置邮箱数、发信数和有效期
- 邮件服务：发件服务开关和系统邮件 SMTP 中转
- 微信与广告：小程序登录、订阅消息和广告设置
- 底部导航：编辑小程序底部 Tab 名称和开关
- 开发者：Webhook 和 API Key

## CLI 与 MCP

CLI 包名为 `@mail59pk/cli`，MCP 包名为 `@mail59pk/mcp`。

```bash
npm i -g @mail59pk/cli
mail59pk config set api-url https://mail.59pk.net
mail59pk config set api-key YOUR_API_KEY
mail59pk create --expiry 1h
mail59pk wait --email-id <id> --timeout 120
mail59pk read --email-id <id> --message-id <message_id>
```

也可以通过环境变量 `MAIL59PK_API_URL` 和 `MAIL59PK_API_KEY` 配置，不写配置文件。

## DNS 记录

建议为发信域名配置 SPF 和 DMARC：

```text
TXT  @  v=spf1 include:spf.mail.qq.com -all
TXT  _dmarc  v=DMARC1; p=none; rua=mailto:postmaster@mail.59pk.net
```

请根据实际使用的 SMTP 服务商调整 include。若同时开启 Cloudflare Email Routing，需要把它的 SPF 记录一并加入。DKIM 取决于发信服务商，可在服务商提供的管理页面中配置。

## License

MIT
