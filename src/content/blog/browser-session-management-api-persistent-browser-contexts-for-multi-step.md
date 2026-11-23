---
title: 'Browser Session Management for Persistent Automation'
description: 'Persistent browser contexts keep logins and storage alive across steps. They cut cold starts, lower cost, and make multi-step automation reliable.'
metaTitle: 'Browser Session Management for Automation'
metaDescription: 'Persistent browser contexts keep logins and storage alive across steps. They cut cold starts, lower cost, and make multi-step automation reliable.'
primaryKeyword: 'browser session management'
secondaryKeywords: 'browser automation, persistent contexts, session state, web scraping, state isolation'
pubDate: 2026-07-31
author: 'Amit Sharma'
tags: ['guides']
---

## Executive Summary

A Browser Session Management API opens a persistent browser context, runs multiple commands against it — navigate, click, extract, screenshot — and keeps the state alive between calls. Cookies stay. localStorage persists. The login from step two is still valid in step seven. The browser does not cold-start for every request.

This matters because the web was not designed for stateless extraction. A product listing requires search, filter, scroll, and detail clicks. An AI agent booking a flight needs six to twelve sequential steps, each dependent on the previous one. Stateless render APIs break on step three every time.

Session management changes the cost structure too. A persistent browser context eliminates the 2–4 second cold-start penalty per request. At 10,000 multi-step workflows per day, that overhead adds up quickly.

> **The short version:** If your automation needs more than one page load, you need a session. If it needs more than three, a session-based API is cheaper, faster, and more reliable than stitching together stateless renders.

> **A note on Ollagraph:** Ollagraph's browser endpoints are stateless — every call is a fresh browser and nothing persists between calls. Ollagraph does not offer persistent sessions, logins, or cookies across calls. In this guide, the stateful steps are shown in your own Playwright code, and Ollagraph appears only for the single-page steps it actually handles: `/v1/render`, `/v1/scrape` (with `actions`, `js_eval`, `wait_until`), `/v1/screenshot`, and batch/async scraping.

## Key Takeaways

- **A persistent browser context maintains cookies, localStorage, sessionStorage, IndexedDB, and service worker state** across API calls. Stateless APIs lose all of this between requests.
- **Session-based automation is cheaper** for multi-step workflows because browser startup, TLS negotiation, and proxy connection costs are paid once per session instead of once per step.
- **Browser context isolation is critical for concurrent workloads.** Each session must run in an isolated context — or sessions leak authentication tokens into each other.
- **The idle timeout is the single most important configuration parameter.** The sweet spot is 60–120 seconds for most workloads.
- **CDP's `Storage` domain** gives you programmatic control over cookies, localStorage, and cache. You can snapshot and restore browser state for checkpoint-and-retry patterns.
- **Stagehand-style natural-language sessions** add an LLM layer on top of persistent contexts, letting AI agents drive multi-step workflows without writing CSS selectors.
- **The hardest problem in session management is knowing when to kill it.** Orphaned sessions burn memory and inflate your bill.

## 1. Problem Statement

You are building an automation that needs to log into a SaaS dashboard, navigate through three levels of menus, apply a date-range filter, extract a table, and take a screenshot. Six sequential steps, each depending on the state left by the previous one.

A stateless render API cannot do this. No cookies carry over. No JavaScript state persists. You would need to re-authenticate for every single step, sending credentials over the wire six times instead of once.

So you reach for Playwright. You write a script that launches a browser, runs all six steps, and returns the result. It works on your laptop. Then you need to run it a thousand times a day. Now you are managing a browser farm, dealing with memory leaks, patching stealth detection, and wondering why you cannot just call an API.

This is the gap that a Browser Session Management API fills. The persistence of a local Playwright script with the operational simplicity of an HTTP API. You open a session. You send commands. The state stays intact. You do not manage a single browser process.

For example, imagine a team that sends twelve stateless API requests per product, each paying the cold-start penalty. With one session per product, that penalty is paid once instead of twelve times. Same data. Same quality. Different architecture.

## 2. History & Context

Browser automation started with single-shot interactions. Selenium opened a browser, ran your test, closed it. Puppeteer and Playwright improved the developer experience but kept the same pattern: launch, work, close. Sessions were implicit — they lived for the browser process lifetime and died when the script ended.

The shift toward persistent sessions as a first-class API concept happened around 2022–2023, driven by two forces. AI agents needed to interact with web applications over multiple turns. And the economics of browser automation at scale made it obvious that paying the cold-start penalty per request was wasteful.

Early commercial platforms were among the first to offer session-based APIs, and testing platforms followed. Ollagraph took the other path: its browser endpoints (`/v1/render`, `/v1/scrape`, `/v1/screenshot`) are deliberately stateless, one fresh browser per call, and stateful flows such as logins stay in your own Playwright code.

The 2025–2026 evolution has been about context isolation. Early session APIs ran all sessions in the same browser process — one session's cookies could leak into another's. Modern APIs use Playwright's `browser.newContext()` to create fully isolated environments per session.

The other major development is the checkpoint-and-restore pattern. CDP's `Storage` domain lets you read and write cookies, localStorage, and sessionStorage programmatically. Some session APIs now expose snapshot endpoints that let you save and restore browser state.

## 3. What Is a Browser Session Management API?

A Browser Session Management API is an HTTP service that provisions a persistent browser context and lets you send multiple commands against it over time. You open a session, get a session ID, and use that ID for all subsequent requests. The browser stays alive between calls. The state — cookies, localStorage, session state — persists until you close the session or the idle timeout expires.

> **Definition:** A REST API that creates and manages long-lived browser contexts. Each session runs in an isolated browser environment with its own cookies, storage, cache, and origin data. The consumer sends sequential commands (navigate, click, extract, screenshot) against the same session ID. The provider keeps the browser warm between commands and recycles it when the session ends.

The key distinction from a stateless render API is **state persistence**. A stateless API treats every request as a fresh browser. A session API maintains the full browser context — cookies, localStorage, sessionStorage, IndexedDB, and network cache — across every command.

### Three Tiers of Session Management

- **Tier 1 — Basic Session.** Navigate, run JavaScript, extract. You write the selectors. Example: a Playwright `BrowserContext` you drive yourself, or a hosted session API.
- **Tier 2 — Session with Scripting.** Upload a multi-step script with conditionals, loops, and error handling. Example: a Playwright script running in your own worker.
- **Tier 3 — LLM-Driven Session (Stagehand).** Send natural-language instructions, let the model figure out selectors and actions. Example: the open-source Stagehand library driving a Playwright page.

## 4. Architecture: How Persistent Browser Contexts Work

### The Browser Context Model

Playwright and Puppeteer support browser contexts — isolated incognito-like sessions within a single browser process. Each context has its own cookies, localStorage, sessionStorage, cache, and origin permissions. Contexts share the underlying Chromium process but not state.

```text
Browser Process
├── Context A (Session s1) — cookies: {auth=token1}, localStorage: {prefs=dark}
├── Context B (Session s2) — cookies: {auth=token2}, localStorage: {prefs=light}
└── Context C (Session s3) — cookies: {session=abc}, localStorage: {}
```

Each context is fully isolated. Session s1 cannot see s2's cookies. Session s3 cannot read s1's localStorage. This isolation is enforced at the Chromium level, not the API level.

### Request Flow

```text
Your Code ──▶ API Gateway ──▶ Session Router ──▶ Browser Pool ──▶ Context Manager ──▶ CDP ──▶ Chromium
                                                                                                  │
Your Code ◀── API Gateway ◀── Response Parser ◀── CDP Response ◀── Rendered Page ◀────────────────┘
```

- **Step 1 — Session Creation.** The create-session call hits the API gateway. The orchestrator selects an available Chromium instance, calls `browser.newContext()`, and returns a `session_id`.
- **Step 2 — Command Routing.** Every subsequent request includes the `session_id`. The router looks up which Chromium instance owns that context and forwards the command via CDP WebSocket. This takes under 5ms.
- **Step 3 — CDP Execution.** The command is translated into CDP calls. Render becomes `Page.navigate` + `Runtime.evaluate`. Script becomes `Runtime.evaluate`. Screenshot becomes `Page.captureScreenshot`.
- **Step 4 — State Persistence.** Between commands, the context stays alive. Cookies, localStorage, and the page's JavaScript execution context persist unless the page navigates away.
- **Step 5 — Idle Timeout.** If no command arrives within `idle_ttl_seconds`, the session manager closes the context and frees the browser slot.

### The Warm Browser Advantage

The single biggest performance advantage of session-based APIs is the warm browser. A cold browser start involves spawning Chromium (800–1200ms), loading stealth patches (200–400ms), establishing the CDP WebSocket (100–200ms), TLS handshake (100–300ms), and proxy connection setup (200–500ms). Total: 1.4–2.6 seconds per request.

A warm browser pays this cost once. Subsequent commands skip the browser spawn, stealth injection, and proxy handshake, executing in 300–800ms instead of 1.4–2.6 seconds. For a 10-step workflow, that is 3–5 seconds saved per run.

### Decision Tree: Stateless vs Session vs Self-Hosted

```text
How many steps does your workflow need?
│
├── 1 step ──▶ Use stateless render API
├── 2-3 steps ──▶ Need auth persistence? Yes ──▶ Session API | No ──▶ Stateless
├── 4-10 steps ──▶ Session API — warm browser pays off after step 3
├── 10-50 steps ──▶ Under 50K sessions/month ──▶ Session API | Over ──▶ Evaluate self-hosted
└── 50+ steps ──▶ Have an infra team? Yes ──▶ Self-hosted | No ──▶ Session API with checkpoint-retry
```

### Inspecting an Active Session

In your own Playwright code (Python, async API), you can inspect a live context at any point:

```python
# Your own Playwright code — not an Ollagraph API
state = await context.storage_state()
print(page.url, await page.title())
print(len(state["cookies"]), "cookies")
for origin in state["origins"]:
    print(origin["origin"], len(origin["localStorage"]), "localStorage entries")
```

## 5. Session Lifecycle: Create, Use, Keep Alive, Destroy

Every session follows the same lifecycle:

### Phase 1 — Creation
A session is created with configuration parameters that define its behavior for its entire lifetime. These cannot be changed after creation: stealth mode, proxy configuration, proxy region, viewport, user agent, idle TTL, block resources, and optional initial cookies.

```python
# Your own Playwright code — creating an isolated context
context = await browser.new_context(
    viewport={"width": 1280, "height": 720},
    proxy={"server": "http://your-proxy:8000"},
)
```

### Phase 2 — Active Use
While the session is active, you send commands against it. Each command resets the idle timer. Supported commands include `render` (navigate to a URL and return rendered HTML), `script` (execute custom JavaScript), `screenshot` (capture the current page), `cookies` (get or set cookies), and `storage` (read or write localStorage/sessionStorage).

### Phase 3 — Keep Alive
If your workflow has pauses longer than the idle TTL, send keepalive requests. A keepalive resets the idle timer without performing any action. With most hosted providers, any command against the session resets the timer; with your own Playwright pool, the idle timer is your own code.

### Phase 4 — Destruction
A session ends in one of three ways: explicit close (a close/DELETE call, or `context.close()` in Playwright), idle timeout (no command arrives within the TTL), or error (browser crash, infrastructure failure). After destruction, any request with that session ID returns a 404 or 410 error.

## 6. State Management: Cookies, Storage, and Authentication

### What Persists
- **Cookies.** Every cookie set by the page — session cookies, persistent cookies, HttpOnly, SameSite — stays in the context. A login flow sets an auth cookie that remains valid for all subsequent navigations.
- **localStorage.** Key-value data persists across navigations within the same origin.
- **sessionStorage.** Persists within the same tab context across page navigations.
- **IndexedDB, network cache, and WebSocket connections** also persist within the session.

### What Does Not Persist
- **Page JavaScript context.** When you navigate to a new URL, the previous page's JavaScript execution context is destroyed.
- **Service workers and browser extensions** do not persist or are not loaded in session contexts.

### Authentication Patterns

Logins need a persistent context, so these patterns are your own Playwright code (Python, async API). Ollagraph's endpoints are stateless and cannot log in or carry cookies between calls.

#### Pattern 1 — Credential Injection
Navigate to the login page, fill credentials, click submit. The resulting auth cookie persists for all subsequent navigations.

```python
# Your own Playwright code
page = await context.new_page()
await page.goto("https://app.target.com/login")
await page.fill("#email", "user@example.com")
await page.fill("#password", "mypassword")
await page.click('button[type="submit"]')
await page.wait_for_url("**/dashboard")
html = await page.content()
```

#### Pattern 2 — Cookie Injection
Inject valid authentication cookies when you create the context, avoiding the login step entirely:

```python
# Your own Playwright code
context = await browser.new_context()
await context.add_cookies([
    {"name": "sessionid", "value": "abc123", "domain": ".target.com", "path": "/"},
    {"name": "csrftoken", "value": "xyz789", "domain": ".target.com", "path": "/"},
])
```

#### Pattern 3 — Token-Based Auth
For SPAs that use Bearer tokens in localStorage, inject the token via script after navigation:

```python
# Your own Playwright code
await page.goto("https://app.target.com")
await page.evaluate("""() => {
    localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIs...');
    localStorage.setItem('user', JSON.stringify({id: 123, role: 'admin'}));
}""")
await page.goto("https://app.target.com/admin")
```

To checkpoint this state, `await context.storage_state(path="state.json")` writes cookies and localStorage to a file, and `await browser.new_context(storage_state="state.json")` restores it in a fresh context.

## 7. Browser Context Isolation for Concurrent Workloads

If you are running multiple sessions concurrently — and you should be, because that is how you scale — context isolation is a security boundary.

- **Why Isolation Matters:** Without isolation, one session's data leaks into another. If concurrent jobs share a browser context, session A's cookies become visible to session B's requests.
- **How Isolation Works:** Modern session APIs use Playwright's `browser.newContext()` to create a fully isolated environment per session. Each context has its own cookie jar, localStorage, sessionStorage, IndexedDB, cache storage, origin permissions, and proxy configuration.
- **Memory Implications:** Each browser context adds approximately 10–30 MB of overhead. The bulk of the memory cost is the shared Chromium process (200–600 MB). A well-designed session pool can handle 50–100 concurrent sessions on a single 8-vCPU, 32 GB instance.

## 8. Configuration & Setup

### Running a Persistent Context Yourself (Playwright)

The session lifecycle below is your own Playwright code (Python, async API). Ollagraph does not host persistent sessions.

#### Step 1 — Create a context

```python
# Your own Playwright code
from playwright.async_api import async_playwright

pw = await async_playwright().start()
browser = await pw.chromium.launch()
context = await browser.new_context(viewport={"width": 1280, "height": 720})
page = await context.new_page()
# Block images and fonts for extraction-only workflows
await page.route("**/*", lambda route: route.abort()
                 if route.request.resource_type in ("image", "font") else route.continue_())
```

#### Step 2 — Navigate to a URL

```python
await page.goto("https://example.com", wait_until="networkidle", timeout=30000)
```

#### Step 3 — Run custom JavaScript

```python
title = await page.evaluate("document.title + ' | ' + document.querySelector('h1').textContent")
```

#### Step 4 — Take a screenshot

```python
await page.screenshot(path="page.png", full_page=True)
```

#### Step 5 — Close the session

```python
await context.close()
await browser.close()
await pw.stop()
```

### Where Ollagraph Fits: the Stateless Steps

Every Ollagraph call is a fresh browser, so use it for steps that don't need a login or earlier state: public pages, JavaScript-heavy pages, single-page interactions, screenshots, and bulk jobs.

```bash
# Post-hydration HTML of a public page (1 credit)
curl -X POST https://api.ollagraph.com/v1/render \
  -H "Authorization: Bearer $OLLAGRAPH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Click / type / scroll on the loaded page, then evaluate JavaScript (1 credit)
curl -X POST https://api.ollagraph.com/v1/scrape \
  -H "Authorization: Bearer $OLLAGRAPH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "wait_until": "networkidle0",
    "actions": [{"action": "click", "selector": "button.load-more"}, {"action": "scroll_to_bottom"}],
    "js_eval": "document.title + \" | \" + document.querySelector(\"h1\").textContent"
  }'

# Full-page screenshot, returned as image bytes (3 credits)
curl -X POST https://api.ollagraph.com/v1/screenshot \
  -H "Authorization: Bearer $OLLAGRAPH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "full_page": true}' \
  --output page.png
```

Actions run once on the loaded page before capture and do not wait for a navigation, so they cannot log in. For many URLs, use `/v1/scrape/batch`, or `/v1/scrape/batch/async` with a `webhook_url`.

### Key Configuration Parameters

| Setting | Description | Recommended Value |
|---|---|---|
| Stealth patches | Anti-detection patches (not built into Playwright) | On for production |
| `proxy` | Proxy server for the context | Residential for protected sites, datacenter for public sites |
| Proxy region | Geographic region for proxy IP | Match your target site's region |
| `viewport` | Browser window dimensions | `1280x720` or match real user profiles |
| Idle TTL | Seconds before an idle context is closed (your own timer) | `60-120` for most workflows, `300+` for slow workflows |
| Resource blocking | Resource types aborted via `page.route()` | `image`, `font`, `stylesheet` for extraction-only |
| `storage_state` | Initial cookies and localStorage | Only if you have pre-existing auth state |
| `user_agent` | Custom user agent string | Omit to use the default |

## 9. Code Examples: Python and Node.js

### Python: Multi-Step E-Commerce Extraction

The logged-in steps run in your own Playwright context. The public search page is a single stateless step, so Ollagraph can extract and screenshot it.

```python
import json, os, requests
from playwright.async_api import async_playwright

# --- Steps 1-3: your own Playwright code (login needs a persistent context) ---
async def login_and_read_dashboard():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto("https://target-store.com/login", wait_until="networkidle")
        await page.fill("#email", "user@example.com")
        await page.fill("#password", "password123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard")
        html = await page.content()
        await context.close()
        await browser.close()
        return html

# --- Steps 4-5: public search results via Ollagraph (stateless, fresh browser per call) ---
HEADERS = {"Authorization": f"Bearer {os.environ['OLLAGRAPH_API_KEY']}"}
SEARCH_URL = "https://target-store.com/search?q=wireless+headphones"

resp = requests.post("https://api.ollagraph.com/v1/scrape", headers=HEADERS, json={
    "url": SEARCH_URL,
    "wait_until": "networkidle0",
    "js_eval": "JSON.stringify(Array.from(document.querySelectorAll('.product-card')).slice(0, 5).map(p => ({name: p.querySelector('.product-name')?.textContent?.trim(), price: p.querySelector('.product-price')?.textContent?.trim(), rating: p.querySelector('.product-rating')?.textContent?.trim(), url: p.querySelector('a')?.href})))",
})
products = json.loads(resp.json()["eval_result"])

# Screenshot (raw image bytes by default)
resp = requests.post("https://api.ollagraph.com/v1/screenshot", headers=HEADERS,
                     json={"url": SEARCH_URL, "full_page": True})
with open("search_results.png", "wb") as f:
    f.write(resp.content)
```

### Node.js: Multi-Step Flow in Your Own Playwright Context

Multi-step, stateful flows like a flight search are your own Playwright code. An LLM-driven layer such as the open-source Stagehand library can sit on top of the same page object if you want natural-language actions instead of selectors.

```javascript
// Your own Playwright code — not an Ollagraph API
import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto("https://example-flights.com");
await page.click("text=Flights");
await page.fill("#departure", "New York");
await page.fill("#destination", "London");
await page.click("button[type=submit]");
await page.waitForSelector(".flight-result");

const flights = await page.$$eval(".flight-result", rows => rows.slice(0, 5).map(r => ({
  airline: r.querySelector(".airline")?.textContent?.trim(),
  departure_time: r.querySelector(".departure")?.textContent?.trim(),
  arrival_time: r.querySelector(".arrival")?.textContent?.trim(),
  price: r.querySelector(".price")?.textContent?.trim(),
  stops: Number(r.querySelector(".stops")?.textContent ?? 0)
})));

await context.close();
await browser.close();
```

## 10. Performance & Benchmarks

To compare the two approaches, run the same multi-step workflow both ways — for example a 6-step e-commerce extraction (login, navigate dashboard, search, extract listing, open detail page, screenshot) — using self-hosted Playwright with a fresh browser per step vs one persistent context. Run each approach enough times against a site you actually target to get stable percentiles, and measure:

- Total time (p50 and p95)
- Cold-start cost (startup time × number of browser launches)
- Success rate
- Cost per workflow
- Data transferred

The stateless approach pays the cold-start penalty once per step; the session approach pays it once. Note which step stateless runs fail on: an anti-bot system may flag rapid requests from different browser instances, while a single browser keeps a consistent fingerprint.

## 11. Security Considerations

- **Context Isolation as a Security Boundary.** Each session must run in an isolated browser context. Verify your provider uses Playwright's `browser.newContext()` or equivalent, not just separate tabs. Tabs within the same context share cookies and storage. Contexts do not.
- **Credential Exposure.** When you inject credentials into a session, they exist in the browser's memory for its lifetime. Mitigations: use short-lived session tokens, inject HttpOnly cookies instead of filling login forms, close sessions immediately after the workflow completes, and never inject credentials into a session that visits untrusted pages.
- **Session Hijacking.** A session ID is a bearer token. Treat it like an API key — transmit over TLS, never log it, rotate if compromised.
- **Data Exfiltration via Screenshots.** Screenshot endpoints can capture sensitive data. Restrict screenshot access to authorized users only.

## 12. Troubleshooting

- **Session Not Found (404).** The idle timeout expired, the session was closed, or the provider recycled the browser. Fix: implement retry logic with session re-creation and restart from the last checkpoint.
- **Command Timeout.** The target page is slow or stuck. Fix: set `wait_until` to `domcontentloaded` instead of `networkidle`. Block unnecessary resources.
- **Authentication Lost Mid-Session.** The target site's session token expired (15–60 minute lifetime) or a redirect loop stripped the auth header. Fix: monitor responses for login page indicators and re-authenticate within the same session.
- **Browser Crash.** Rare with memory-intensive pages. Fix: the session manager detects the crash and returns 500. Create a new session and retry.
- **Memory Exhaustion.** Too many sessions without cleanup. Fix: always close sessions explicitly with DELETE. Set aggressive idle TTLs (60 seconds) for development.

## 13. Best Practices

- **Always close sessions explicitly.** Idle timeouts are a safety net, not a primary cleanup mechanism. Use `try/finally` blocks or context managers.
- **Set the idle TTL to match your workflow.** For most workflows, 60–120 seconds is sufficient.
- **Block resources you do not need.** Aborting image, font, and stylesheet requests (for example with `page.route()` in Playwright) cuts page load time by 60–80%.
- **Use cookie injection instead of form login** when possible. Cookie injection is deterministic and avoids CAPTCHAs.
- **Implement checkpoint-and-retry for long workflows.** Save state after login and after each extraction. If the session dies, restore the checkpoint.
- **Monitor session health proactively.** Track session creation rate, active session count, average session duration, and failure rate.

### Production Session Checklist

- [x] Idle TTL is at least 2x the slowest page load time
- [x] Session cleanup is in a finally block or context manager
- [x] Retry logic exists for session creation (exponential backoff with jitter)
- [x] Checkpoint state is saved after login
- [x] Resource blocking is configured
- [x] Proxy type matches the target site
- [x] Screenshot capability is restricted per API key
- [x] Active session count is monitored with an alert
- [x] Session ID is never logged
- [x] Workflow handles 404 on session commands

## 14. Common Mistakes

1. **Treating sessions like database connections.** A browser session is a stateful environment, not a connection pool. Reusing a session across unrelated tasks mixes state unpredictably.
2. **Forgetting that page navigations destroy JavaScript state.** When you call render with a new URL, variables from a previous script call are undefined after navigation.
3. **Setting idle TTL too low for slow pages.** Set TTL to at least 2x your expected maximum page load time.
4. **Not handling session creation failures.** Implement retry logic with exponential backoff.
5. **Using sessions for single-page extractions.** For one page load, use a stateless render API.
6. **Ignoring the proxy cost in session pricing.** Account for per-request proxy fees inside multi-step sessions.

## 15. Alternatives & Comparison

| Feature | Stateless Render API | Session API (Managed) | Self-Hosted Playwright |
|---|---|---|---|
| **State persistence** | None | Full (cookies, storage, cache) | Full |
| **Cold-start per step** | Every request | Once per session | Once per script |
| **Multi-step workflows** | Not supported | Native | Native |
| **Context isolation** | N/A | Built-in | Manual |
| **Stealth patches** | Provider-managed | Provider-managed | Self-maintained |
| **Proxy management** | Provider-managed | Provider-managed | Self-managed |
| **Cost per 10K sessions** | $200–$400 | $150–$300 | $100–$250 (infra only) |
| **Engineering overhead** | None | Minimal | High |

- **Stateless Render APIs (`/v1/render`):** Best for single-page extractions without login. Ollagraph sits in this column: `/v1/render`, `/v1/scrape` (JS rendering + page actions (click/type/scroll) + JS eval) and `/v1/screenshot` each run a fresh browser per call, with `/v1/scrape/batch`, `/v1/scrape/async` and `/v1/crawl` for volume.
- **Managed Session APIs:** Best for multi-step workflows, authenticated pages, and AI agents.
- **Self-Hosted Playwright:** Best when you have a dedicated infrastructure engineering team and volume exceeds 50,000 sessions/month.

## 16. Enterprise / Cloud Deployment

- **Session Pool Management.** At enterprise scale, manage session pools with minimum idle buffers (10–15 warm instances for a 50-session workload), maximum caps, and session affinity.
- **Observability.** Track session creation rate, active session count, and average session duration.
- **Multi-Tenant Isolation.** Each tenant should get its own session pool with separate API keys, rate limits, and billing.

## 17. FAQs

### Q1. What is the difference between a browser session and a browser context?
A browser session is the API-level concept: a persistent connection between your code and a remote browser. A browser context is the Chromium-level concept: an isolated incognito-like environment with its own cookies, storage, and cache. One API session maps to one browser context.

### Q2. How long can a browser session stay alive?
Hosted sessions typically stay alive as long as commands arrive within the idle timeout window. In practice, most sessions last 5–30 minutes. Providers typically recycle sessions after 1–2 hours regardless of activity.

### Q3. Can I reuse a session across different target websites?
Technically yes, but not recommended. Cookies and storage from Site A remain in the context when you navigate to Site B. Use one session per target site.

### Q4. Does a session survive a network disconnect?
No. If your client loses connectivity, the session continues running on the provider's infrastructure until the idle timeout expires. You must create a new session.

### Q5. How do I handle rate limiting inside a session?
Rate limiting from the target site affects the browser inside the session, not your API calls. Use a different proxy, add delays between commands, or create a new session with a different proxy.

### Q6. What happens to the session if the browser crashes?
The session becomes invalid immediately. The provider detects the crash and frees the resources. Your client must create a new session and retry.

### Q7. Can I run multiple tabs inside a single session?
Most session APIs support a single tab per session. For multiple tabs, create multiple sessions. Each session gets its own browser context with full isolation.

### Q8. Is session-based automation more expensive than stateless?
For single-page extractions, stateless is cheaper. For multi-step workflows (3+ steps), session-based is usually cheaper because the cold-start cost is amortized across multiple commands.

### Q9. How do I debug what is happening inside a session?
Use the screenshot endpoint to capture the current page state. Use the script endpoint to inspect cookies (`document.cookie`) and localStorage (`Object.keys(localStorage)`).

### Q10. Can I inject cookies into an existing session?
Yes, if the provider exposes a cookie endpoint. In your own Playwright code, call `context.add_cookies()`. Ollagraph's endpoints are stateless and do not accept cookies.

### Q11. What is the difference between idle timeout and session max lifetime?
Idle timeout is the maximum time without commands before the session is killed. Session max lifetime is the absolute maximum the session can exist regardless of activity. Hosted providers typically pair a configurable idle TTL with a fixed max lifetime of an hour or two.

### Q12. Can I use a session API for real-time browser monitoring?
Session APIs are request-response, not real-time streaming. For real-time monitoring, run a local Playwright script that keeps the page open and streams updates.

## 18. Conclusion

Browser session management is the architectural pattern that makes multi-step automation practical at scale. Stateless render APIs work for single-page extractions, but the moment your workflow needs to log in, paginate, or maintain state across multiple interactions, you need a persistent session.

The economics follow from the architecture: a session-based approach pays the cold-start cost once per workflow instead of once per step. The engineering overhead is minimal: create a session, send commands, close it. The provider handles browser management, stealth patches, proxy routing, and context isolation.

### Next steps:
- Read our [Headless Browser API Guide](/blog/headless-browser-api-the-complete-guide-to-automating-chrome-at-scale/).
- Learn about [Headless Chrome as a Service: Build vs Buy](/blog/headless-chrome-as-a-service-when-to-build-vs-buy-browser-infrastructure/).
- Explore [Browser Automation Observability at Scale](/blog/browser-automation-observability-monitoring-headless-chrome-at-scale/).

## 19. References

- [Chrome DevTools Protocol (CDP)](https://chromedevtools.github.io/devtools-protocol/)
- [Playwright Browser Contexts](https://playwright.dev/docs/api/class-browsercontext)
- [Puppeteer Browser Contexts](https://pptr.dev/api/puppeteer.browsercontext)
- [Ollagraph API Documentation](https://ollagraph.com/docs/)
