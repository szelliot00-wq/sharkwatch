export function proxied(url) {
  return `https://corsproxy.io/?url=${encodeURIComponent(url)}`
}
