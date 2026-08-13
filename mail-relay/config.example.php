<?php
// 复制为 config.php 后填写真实配置

// QQ 邮箱：smtp.qq.com / 465（SSL）
// 网易邮箱：smtp.163.com / 465（SSL）
const SMTP_HOST = 'smtp.qq.com';
const SMTP_PORT = 465;
const SMTP_USER = 'your-mailbox@qq.com';
const SMTP_PASS = 'your-smtp-authorization-code';

// 发件地址必须是 SMTP 邮箱本身
const FROM_EMAIL = 'your-mailbox@qq.com';
const FROM_NAME = 'mail.59pk.net';

// 与后台“系统邮件 - 中转密钥”保持一致
const RELAY_TOKEN = 'change-me-to-a-long-random-string';
