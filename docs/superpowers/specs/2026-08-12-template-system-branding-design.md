# mail.59pk.net 模板系统与品牌设置设计

## 背景与目标

在 mail.59pk.net 现有架构上做二次开发，实现两个能力：

1. 皇帝可以在“网站配置”中自定义全站 TDK、网站名称、Logo 和网站图标。
2. 建立“完整模板模式”，多个前端模板代码内置、共存，管理员在后台一键切换启用，并支持发布前预览。

## 需求决策

- 模板粒度：完整模板模式，每个模板可拥有独立的页面布局、组件结构和视觉风格。
- 模板来源：代码内置模板，后台只负责选择启用哪个模板。
- 切换范围：全站统一生效，提供管理员预览模式，普通访客只能看到正式启用的模板。
- 首批模板：共 5 个，分两期交付。
  - 第一期：东方云笺、霓虹夜航、清爽白 + 品牌蓝。
  - 第二期：暖白 + 墨绿、极简黑白 + 朱砂红。
- 品牌信息：TDK、网站名称、Logo、图标全站统一，与模板解耦。
- 未上传 Logo 时，页头只显示网站名称，不显示 Logo 图片。
- 未上传图标时，自动用网站名称首字生成浏览器与 PWA 图标。
- 东方云笺首页必须压缩为桌面端一屏，不能出现大面积空白和强制滚动。

## 总体架构

### 模板目录

每个模板独立存放在仓库 `templates/<template-id>/` 下：

```text
templates/
  registry.ts
  east-paper/
    config.ts
    pages/
      home.tsx
      login.tsx
      mailbox.tsx
      profile.tsx
      shared-email.tsx
      shared-message.tsx
      shared-error.tsx
    components/
      header.tsx
      logo.tsx
      ...模板专用组件
    styles/
      template.css
  neon-night/
  classic-clean-blue/
```

`config.ts` 定义模板元数据：

```ts
interface TemplateConfig {
  id: string
  name: string
  description: string
  version: string
  thumbnail: string // 后台卡片缩略图，使用内置 SVG 或静态图片
}
```

`registry.ts` 汇总全部模板，并导出按 id 查找模板的工具函数。

### 运行时选择

- KV 键 `ACTIVE_TEMPLATE` 保存当前模板 id，默认 `east-paper`。
- `app/[locale]/page.tsx`、登录页、邮箱页、个人中心页、分享页改为薄壳：
  1. 读取 `ACTIVE_TEMPLATE`；
  2. 检查 URL 参数 `?template=<id>`，仅当当前会话拥有 `MANAGE_CONFIG` 权限时允许覆盖；
  3. 从 `registry.ts` 解析模板组件并渲染；
  4. 模板 id 不存在或 KV 读取失败时回退到 `east-paper`。
- 数据层、API 路由、权限、认证逻辑不进入模板目录，模板只负责 UI。

### 样式作用域

- 每个模板的 `template.css` 统一挂在 `body[data-template="<id>"]` 作用域下，避免模板之间互相污染。
- 所有模板样式在构建时静态引入；第一期 3 个模板体积可控，第二期再评估按需加载。
- 模板可以通过 `config.ts` 声明自己的字体栈、圆角、背景等设计令牌，但网站名称、Logo、TDK 必须来自全局品牌配置。

## 品牌设置

### KV 键

```text
SITE_NAME        网站名称，默认 mail.59pk.net
SITE_TITLE       全站 SEO 标题
SITE_DESCRIPTION 全站 SEO 描述
SITE_KEYWORDS    全站 SEO 关键词
SITE_LOGO        上传的 Logo，data URL 格式
SITE_ICONS       上传图标 JSON：{ 16, 32, 192, 512 }
```

品牌键未设置时，SEO 元数据回落到现有各语言默认值，网站名称回落到 `mail.59pk.net`。

### 元数据生成

`generateMetadata` 改为优先读取 KV 中的 `SITE_TITLE / SITE_DESCRIPTION / SITE_KEYWORDS`，未设置时继续使用现有 next-intl 各语言默认文案。

### Logo 与图标

- 上传限制：PNG / JPG / WebP，单文件不超过 2MB。
- 上传后由前端 canvas 生成 16、32、192、512 四个尺寸的 PNG，与原图一起提交给配置接口，存入 KV。
- 新增公开路由 `GET /api/site-logo` 和 `GET /api/site-icon?size=16|32|192|512`：
  - 有自定义内容时返回存储图片；
  - 没有自定义 Logo 时，`/api/site-logo` 返回 204；
  - 没有自定义图标时，动态生成“网站名称首字”图标并返回 PNG。
- `app/[locale]/layout.tsx` 的 `<link rel="icon">` 与 PWA manifest 图标地址指向上述动态路由。

## 管理后台

在现有“网站配置”面板中新增两个区块：

### 基本品牌

- 网站名称
- SEO 标题
- SEO 描述
- SEO 关键词
- Logo 上传与预览
- 图标上传与预览（展示 16、32、192、512 预览）

未上传 Logo 时显示“当前仅显示网站名称”的提示。

### 模板管理

- 从 `registry.ts` 读取全部模板，以卡片网格展示：
  - 缩略图
  - 模板名称
  - “使用中”状态标识
  - “预览”按钮：打开新标签页，URL 带 `?template=<id>`
  - “启用”按钮：写 KV `ACTIVE_TEMPLATE`，立即生效

## 接口与数据流

- 扩展 `GET /api/config`：返回 `siteName`、TDK、`hasLogo`、`activeTemplate`。
- 扩展 `POST /api/config`（仅皇帝）：保存品牌字段和 `activeTemplate`。
- Logo/图标以 data URL 随配置接口提交，不再新增存储服务；KV 单值容量足够承载 512 PNG 的 base64。
- 公开图片路由读取 KV 并返回对应 Content-Type，带浏览器缓存头。

## 国际化

- 新增后台文案写入 zh-CN、zh-TW、en、ja、ko 五套消息文件。
- 模板页面继续使用现有 next-intl 文案体系，模板不新增独立文案文件。

## 错误处理与回退

- `ACTIVE_TEMPLATE` 非法或缺失：回退 `east-paper`。
- 品牌 KV 缺失：回退各语言默认元数据与默认 mail.59pk.net 名称。
- 上传内容无法解码：前端校验失败并提示，不写入 KV。
- 图片路由读取异常：返回 404，页面继续使用默认图标。

## 验证与验收

- `pnpm lint` 通过，`pnpm build` 通过。
- 三个模板分别截图验证桌面端与移动端无横向溢出。
- 东方云笺桌面端 1440x900 下首页一屏内完整展示。
- 验收场景：
  1. 皇帝修改网站名称与 TDK 后，页面标题、描述、页头名称立即更新。
  2. 上传 Logo 后页头显示图片；删除/未上传时只显示网站名称。
  3. 上传图标后 favicon 与 PWA 图标更新；未上传时显示首字图标。
  4. 模板卡片可预览、可启用；启用后普通访客看到新模板，皇帝预览不影响线上。

## 风险与取舍

- 多模板静态引入会增大构建体积，第一期可接受，第二期再评估动态加载。
- 霓虹夜航需要从 git 历史恢复并适配模板接口，属于中等工作量。
- 本地开发缺少 Cloudflare KV 绑定，品牌配置和模板切换需通过生产部署或 wrangler 绑定环境验证。
- 本期不引入 R2，Logo/图标存 KV；若未来支持大图或视频，再迁移存储。

## 不在本期范围

- 后台上传自定义模板包。
- 登录用户个人选择模板。
- 按页面分别配置 TDK。
- 邮件附件、全文搜索等邮件功能扩展。

## 实施阶段

1. 搭建模板系统骨架：registry、模板解析、KV 读取、预览参数。
2. 把东方云笺迁入模板目录并压缩首页为一屏。
3. 从 git 历史恢复霓虹夜航并迁入模板目录。
4. 新建经典简洁（清爽白 + 品牌蓝）模板。
5. 实现品牌设置 API 与后台界面、图片上传与图标生成。
6. 实现模板管理卡片区与预览/启用。
7. 国际化、lint/build、截图验证、部署上线。
