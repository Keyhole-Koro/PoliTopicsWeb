export function formatAsDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
