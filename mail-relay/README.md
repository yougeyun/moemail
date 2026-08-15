# 系统邮件 SMTP 中转

Cloudflare Pages 的 Edge 运行时不能直接使用 Node SMTP 库，因此验证码、激活邮件以及用户从临时邮箱发出的邮件，都通过这个 HTTPS 中转接口发送。

## 部署步骤

1. 将本目录下的 `send.php` 上传到宝塔或其他 PHP 站点目录。
2. 复制 `config.example.php` 为 `config.php`。
3. 填写 QQ 邮箱或网易邮箱的 SMTP 配置。
4. 确保该目录通过 HTTPS 可访问。
5. 在 `mail.59pk.net` 后台“系统邮件”中填写中转地址和密钥。
6. 后台“发件服务”开启后，临时邮箱发件也会调用同一中转接口。

## 配置示例

```php
const SMTP_HOST = 'smtp.qq.com';
const SMTP_PORT = 465;
const SMTP_USER = 'your-mailbox@qq.com';
const SMTP_PASS = 'your-smtp-authorization-code';
const FROM_EMAIL = 'your-mailbox@qq.com';
const FROM_NAME = 'mail.59pk.net';
const RELAY_TOKEN = 'change-me-to-a-long-random-string';
```

QQ 邮箱需要先在邮箱设置中开启 SMTP 并生成客户端授权码，网易邮箱同理。

## 注意事项

- 免费个人邮箱 SMTP 有日发送量限制，只适合起步阶段。
- `config.php` 不要提交到 Git。
- 中转接口建议只允许 Cloudflare 出口 IP 访问，并保持 `RELAY_TOKEN` 为高强度随机值。
