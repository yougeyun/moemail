function formatTime(value) {
  if (!value) return ""
  const date = new Date(value)
  const pad = (num) => String(num).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function expiryLabel(value) {
  const map = {
    3600000: "1小时",
    86400000: "1天",
    604800000: "7天",
    2592000000: "30天",
    0: "永久"
  }
  return map[value] || "自定义"
}

module.exports = {
  formatTime,
  expiryLabel
}
