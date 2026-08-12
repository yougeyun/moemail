export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

export async function resizeImageToDataUrl(
  file: File,
  size: number
): Promise<string> {
  const sourceUrl = await fileToDataUrl(file)
  const image = await loadImage(sourceUrl)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas 不可用")

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  const sourceSize = Math.min(image.width, image.height)
  const sx = (image.width - sourceSize) / 2
  const sy = (image.height - sourceSize) / 2
  context.drawImage(
    image,
    sx,
    sy,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size
  )
  return canvas.toDataURL("image/png")
}

export async function generateIconSet(
  file: File
): Promise<Record<string, string>> {
  const sizes = [16, 32, 192, 512] as const
  const icons: Record<string, string> = {}
  for (const size of sizes) {
    icons[String(size)] = await resizeImageToDataUrl(file, size)
  }
  return icons
}

export async function generateFirstCharacterIcon(
  siteName: string,
  size: number
): Promise<string> {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas 不可用")

  const backgroundColor = "#2563EB"
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, size, size)

  const firstChar = (siteName.trim()[0] || "M").toUpperCase()
  context.fillStyle = "#FFFFFF"
  context.font = `600 ${Math.round(size * 0.55)}px sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(firstChar, size / 2, size / 2 + size * 0.03)

  return canvas.toDataURL("image/png")
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("图片加载失败"))
    image.src = src
  })
}
