import { readFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const miniRoot = join(root, "miniprogram")
const errors = []

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf-8"))
}

function checkJs(file) {
  const source = readFileSync(file, "utf-8")
  try {
    new Function(source)
  } catch (error) {
    errors.push(`${file}: JS 语法错误: ${error.message}`)
  }

  const requirePattern = /require\(\s*["']([^"']+)["']\s*\)/g
  let match
  while ((match = requirePattern.exec(source)) !== null) {
    const specifier = match[1]
    if (!specifier.startsWith(".")) continue
    const target = resolve(dirname(file), specifier)
    const candidates = [target, `${target}.js`, join(target, "index.js")]
    if (!candidates.some(existsSync)) {
      errors.push(`${file}: 找不到模块 "${specifier}"`)
    }
  }
}

function checkWxml(file) {
  let source = readFileSync(file, "utf-8").replace(/<!--[\s\S]*?-->/g, "")
  const stack = []
  const tagPattern = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g
  let match
  while ((match = tagPattern.exec(source)) !== null) {
    const closing = match[1] === "/"
    const tag = match[2]
    const attrs = match[3] || ""
    if (closing) {
      if (stack.length === 0) {
        errors.push(`${file}: 多余的闭合标签 </${tag}>`)
        continue
      }
      const open = stack.pop()
      if (open !== tag) {
        errors.push(`${file}: 标签不匹配 </${tag}>，期望 </${open}>`)
      }
      continue
    }
    if (!attrs.trim().endsWith("/")) {
      stack.push(tag)
    }
  }
  if (stack.length > 0) {
    errors.push(`${file}: 未闭合标签 <${stack.join(", ")}>`)
  }
}

function checkWxss(file) {
  let source = readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/["'][^"']*["']/g, '""')
  const open = (source.match(/\{/g) || []).length
  const close = (source.match(/\}/g) || []).length
  if (open !== close) {
    errors.push(`${file}: 花括号不匹配 (${open} vs ${close})`)
  }
}

const appConfig = readJson(join(miniRoot, "app.json"))
const pages = appConfig.pages || []
if (pages.length === 0) {
  errors.push("miniprogram/app.json 未配置页面")
}

for (const page of pages) {
  for (const ext of ["js", "json", "wxml", "wxss"]) {
    const file = join(miniRoot, `${page}.${ext}`)
    if (!existsSync(file)) {
      errors.push(`缺少页面文件: ${file}`)
    }
  }
  const jsFile = join(miniRoot, `${page}.js`)
  const jsonFile = join(miniRoot, `${page}.json`)
  const wxmlFile = join(miniRoot, `${page}.wxml`)
  const wxssFile = join(miniRoot, `${page}.wxss`)
  if (existsSync(jsFile)) checkJs(jsFile)
  if (existsSync(jsonFile)) readJson(jsonFile)
  if (existsSync(wxmlFile)) checkWxml(wxmlFile)
  if (existsSync(wxssFile)) checkWxss(wxssFile)
}

const tabPages = (appConfig.tabBar?.list || []).map((item) => item.pagePath)
for (const tabPage of tabPages) {
  if (!pages.includes(tabPage)) {
    errors.push(`TabBar 页面未注册: ${tabPage}`)
  }
}

for (const file of ["app.js", "app.json", "app.wxss", "utils/request.js", "utils/config.js", "utils/ads.js"]) {
  const full = join(miniRoot, file)
  if (!existsSync(full)) {
    errors.push(`缺少文件: ${full}`)
  } else if (file.endsWith(".js")) {
    checkJs(full)
  } else if (file.endsWith(".json")) {
    readJson(full)
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"))
  process.exit(1)
}

console.log("小程序静态检查通过")
