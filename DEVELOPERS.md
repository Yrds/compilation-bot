# Note for developers

# To avoid bot detection on tiktok

- Never use CURL/Requests directly on tiktok pages, always use puppeteer with a logged in account and slowMo ( > 100ms)
- Tiktok CDN doesn't have bot detection(at this time), but for garantee make random timeouts between requests
