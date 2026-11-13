---
title: 'How to Connect Cursor IDE to a Web Search MCP Server Using Ollagraph'
description: 'Configure Cursor IDE with Ollagraph''s Model Context Protocol (MCP) server for live multi-engine web search, real-time scraping, and RAG context injection.'
metaTitle: 'Connect Cursor IDE to Web Search MCP Server'
metaDescription: 'Configure Cursor IDE with Ollagraph''s Model Context Protocol (MCP) server for live multi-engine web search, real-time scraping, and RAG context injection.'
primaryKeyword: 'connect cursor ide to web search mcp server'
secondaryKeywords: 'cursor mcp web search, ollagraph mcp server, model context protocol cursor setup, cursor agent live web search, Cursor IDE, Model Context Protocol (MCP), Ollagraph API, JSON-RPC 2.0, stdio transport, Server-Sent Events (SSE), Anthropic MCP Specification, Headless Chromium, Markdown RAG'
pubDate: 2026-08-20
author: 'Amit Sharma'
tags: ['guides', 'ai-search']
---

## Executive Summary

Connecting Cursor IDE to a web search Model Context Protocol (MCP) server using [Ollagraph](https://ollagraph.com) gives your AI coding agent real-time, multi-engine search capabilities and web-scraping powers directly inside your editor. This setup—much like [integrating MCP web tools into LangGraph multi-agent workflows](/blog/integrating-mcp-web-tools-into-langgraph-autonomous-multi-agent-workflows/)—eliminates model knowledge cutoffs, hallucinated API syntax, and stale library documentation.

To configure it, add an entry to your workspace's `.cursor/mcp.json` (or Cursor's global MCP settings) that runs the `ollagraph-mcp` package from PyPI with `pipx run ollagraph-mcp` and passes your `OLLAGRAPH_API_KEY`. Once connected, Cursor discovers every Ollagraph endpoint as a tool—enabling it to search the live web, render client-side JavaScript, perform [entity extraction for AI agents](/blog/entity-extraction-for-ai-agents-extract-companies-people-products-and-more/), and ingest documentation as clean Markdown without breaking your coding flow.

Connecting an IDE to the live web used to mean constantly copying documentation URLs, switching back and forth between browser tabs, and manually pasting code snippets into chat windows. With the Model Context Protocol (MCP) standard, Cursor IDE can now call external web APIs programmatically.

By linking Cursor to Ollagraph's cloud infrastructure through MCP, you grant Cursor's agent direct access to real-time search engine indexes (understanding [how LLMs index the web](/blog/how-llms-index-the-web-from-crawler-fetch-queues-to-vectorized-knowledge-graphs/)), stealth browser pools, document-to-markdown converters, and domain-intelligence and SEO/AEO audit endpoints.

The underlying process runs locally via an unprivileged stdio subprocess (`ollagraph-mcp`), which intercepts JSON-RPC requests from Cursor and routes them securely over TLS 1.3 to Ollagraph's API gateway. The cloud engine performs multi-engine aggregation, renders dynamic JavaScript single-page applications via headless Chromium when required, strips HTML boilerplate, and returns token-efficient Markdown context directly to Cursor's reasoning loop.

---

## Key Takeaways

- **Zero Knowledge Cutoffs:** Cursor Agent queries live web engines to retrieve up-to-second library releases, breaking API changes, and current documentation without depending on fixed training cutoff dates.
- **Token-Efficient Context:** Ollagraph automatically strips HTML navigation noise, scripts, and CSS, serving pre-processed, citation-backed Markdown directly into Cursor's prompt context window and cutting the tokens wasted on page chrome.
- **Simple JSON-RPC Setup:** Configured in under two minutes via `.cursor/mcp.json`, with Cursor talking to the local `ollagraph-mcp` process over standard input/output (`stdio`).
- **Credit Predictability:** Each Ollagraph endpoint has its own credit cost, and calls that fail are refunded automatically.
- **Enterprise Security Isolation:** Operates under ephemeral memory processing where zero scraped content, context payloads, or search queries are stored on persistent disk or used to train machine learning models.

---

## 1. Problem Statement

Modern AI-assisted coding in Cursor IDE relies heavily on the LLM's pre-trained parametric memory. However, software engineering moves faster than model training schedules. This creates three critical failures in developer workflows:

- **The Knowledge Cutoff Gap:** When using recently updated frameworks (such as Next.js 15, Tailwind v4, Pydantic v2, or LangChain v0.3), Cursor's underlying LLM often invents deprecated parameters, references deleted imports, or hallucinates non-existent methods. This forces developers into frustrating trial-and-error debugging loops.
- **Context Window Contamination:** When developers manually copy raw HTML from documentation sites into Cursor's chat window, up to 80% of the consumed token window consists of irrelevant navigation bars, footer links, inline SVG icons, and tracking scripts. This noise dilutes the LLM's attention mechanism, increases latency, and often leads to incorrect code output.
- **Complex Dynamic SPAs and Anti-Bot Barriers:** Many modern technical documentation portals rely heavily on client-side single-page application (SPA) rendering (e.g., React, Vue, Next.js rehydration) or sit behind anti-bot protection layers (Cloudflare Turnstile, AWS WAF, Akamai). Basic HTTP fetch tools built into naive IDE extensions fail to execute the required JavaScript, returning blank 403 Forbidden or 200 OK empty-shell responses.

Software engineers need a secure, standardized, automated way for Cursor to execute live searches, parse dynamic web content, convert multi-format documents into clean Markdown, and ingest accurate technical facts on demand.

---

## 2. History & Technical Evolution

To understand why connecting Cursor to an MCP server is the modern engineering standard, we must examine how developer context integration evolved across three distinct eras:

- **Manual Copy-Paste Era (2021–2023):** Developers relied on manual context assembly. When hitting an unfamiliar API error, the engineer switched context out of the IDE, opened a web browser, queried Google or DuckDuckGo, navigated Stack Overflow or official documentation, manually copied raw text, and pasted it back into an IDE prompt window. This process averaged 45 to 120 seconds per query and introduced significant context-switching fatigue.
- **Custom Extension & Web-Search Plugin Era (2023–2024):** IDE plugins began integrating custom web scraping extensions. However, these tools issued basic static HTTP GET requests using simple HTTP libraries. They failed whenever a site required client-side JavaScript execution, encountered CAPTCHA challenges, or required session state. Furthermore, they dumped raw HTML into the context window, causing massive token waste and frequent context length limit errors.
- **Model Context Protocol Standard Era (Late 2024–2026):** Anthropic open-sourced the Model Context Protocol (MCP). MCP established a standardized JSON-RPC 2.0 interface that cleanly separates the LLM Client (Cursor IDE) from specialized tool providers (Ollagraph).

Prior to late 2024, every IDE developer plugin implemented its own custom web-scraping logic, API contracts, and context injection rules. This fragmentation caused fragile integrations that broke whenever an underlying site updated its DOM structure.

The introduction of the Model Context Protocol (MCP) established a universal, open standard. By separating the client (Cursor IDE) from the tool provider (Ollagraph), Cursor no longer needs to know how to solve a CAPTCHA, render JavaScript, or parse a PDF. It simply issues a standardized JSON-RPC tool request, and Ollagraph handles the heavy web automation infrastructure in the cloud.

---

## 3. Technical Definition & Core Concept

The Model Context Protocol (MCP) is an open standard based on JSON-RPC 2.0 that allows local desktop applications (MCP Clients, such as Cursor IDE) to discover and invoke tools, resources, and prompt templates exposed by local or remote processes (MCP Servers).

When connecting Cursor to Ollagraph's Web Search MCP server, the architecture relies on three primary components:

- **MCP Client:** Cursor IDE runs a local orchestrator process that manages communication with the LLM context window, registers tool definitions into the prompt system, and routes tool calls.
- **MCP Server (`ollagraph-mcp`):** A small Python package from PyPI, launched locally with `pipx run ollagraph-mcp`. Built on FastMCP, it reads Ollagraph's OpenAPI spec at startup and translates MCP tool execution requests into authenticated API calls against `api.ollagraph.com`.
- **Transport Layer (`stdio`):** Cursor launches `ollagraph-mcp` as a child process, communicating through standard input (`stdin`) and standard output (`stdout`) pipes. Ollagraph does not host a remote MCP endpoint, so there is no SSE or HTTP URL to connect to.

```json
// Core JSON-RPC 2.0 Message Concept Executed Under the Hood
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "Next.js 15 Server Actions breaking changes site:nextjs.org",
      "limit": 3
    }
  },
  "id": 42
}
```

---

## 4. System Architecture & Design

The integration architecture separates heavy computational infrastructure from the local developer workspace across three distinct operational tiers:

### 1. Local Developer Workstation Layer
- **Developer Prompt UI:** The engineer enters a query or code instruction inside Cursor IDE Chat, Inline Edit, or Agent mode.
- **Cursor Agent Orchestrator:** Analyzes prompt intent, detects missing context, and decides which registered MCP tool to invoke based on parameter schemas.
- **Local Subprocess (`ollagraph-mcp`):** Spawns via `pipx`, communicating with Cursor over bidirectional stdio IPC streams using JSON-RPC 2.0 payloads.

### 2. Transport & Cloud Gateway Layer
- **TLS 1.3 Communication:** Encrypted HTTPS communication passing sanitized JSON-RPC tool payloads over port 443.
- **Ollagraph Unified API Gateway:** Authenticates requests via `OLLAGRAPH_API_KEY`, manages credit ledgers, enforces rate limits, and handles automatic credit refunds if upstream fetches fail.

### 3. Execution Infrastructure Layer
- **Live Search Aggregator:** Queries real-time multi-engine search indexes (aggregating search providers) and ranks results using relevance metrics.
- **Stealth Chromium Browser Pool:** Provisions headless Chromium instances to render JavaScript SPAs, bypass anti-bot challenges (Cloudflare, Turnstile, Akamai), and execute client-side scripts.
- **Markdown Parser:** Strips HTML noise, retains semantic headers and links, and formats context for optimal LLM prompt ingestion.

---

## 5. Internal Working Mechanics

When Cursor IDE starts up with Ollagraph configured, the client and server execute a strict three-phase handshake protocol:

```
[Phase 1: Initialization]
Cursor IPC -----> {"method": "initialize", "params": {"protocolVersion": "2024-11-05"}} -----> Ollagraph MCP
Cursor IPC <----- {"result": {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}}}} <----- Ollagraph MCP

[Phase 2: Tool Discovery]
Cursor IPC -----> {"method": "tools/list"} -----> Ollagraph MCP
Cursor IPC <----- {"result": {"tools": [{"name": "search", "description": "..."}, {"name": "scrape_llm_ready", ...}, ...]}} <----- Ollagraph MCP

[Phase 3: Execution Loop]
Developer Prompt: "Find the latest tailwind v4 grid syntax"
Cursor Agent decides to call tool: "search", then "scrape_llm_ready" on the best result
Cursor IPC -----> {"method": "tools/call", "params": {"name": "scrape_llm_ready", "arguments": {"url": "..."}}} -----> Ollagraph MCP
Ollagraph MCP ---> Cloud API ---> Fetches, Renders & Converts to Markdown
Cursor IPC <----- {"result": {"content": [{"type": "text", "text": "..."}]}} <----- Ollagraph MCP
```

### Detailed Execution Phase Description
- **Initialization:** Cursor spawns `pipx run ollagraph-mcp` as a background child process. The client and server negotiate protocol capability limits and verify version compatibility (`2024-11-05` protocol specification).
- **Dynamic Schema Registration:** `ollagraph-mcp` reads Ollagraph's OpenAPI spec at startup and registers one tool per endpoint with Cursor, each carrying the JSON Schema of that endpoint's request (e.g., query strings, URLs, result limits).
- **Autonomous Invocation:** When Cursor's agent determines it needs external information to complete a coding task, it invokes the corresponding Ollagraph tool autonomously.
- **Context Window Formatting:** The tool response returns clean Markdown text blocks. Cursor appends this result directly into the active LLM context window as an observation, enabling the model to generate accurate code based on live documentation.

---

## 6. Core Components & Subsystem Modules

The complete Cursor + Ollagraph integration consists of five decoupled operational modules:

1. **Cursor Client Core:** Monitors prompt inputs for keywords or missing technical context. It triggers agent tool calls when parametric memory confidence is low.
2. **Transport Adapter (`ollagraph-mcp`):** Manages local process lifecycle, handles standard input/output serialization, and passes requests securely to the cloud.
3. **API Gateway & Router:** Validates authentication tokens (`osk_...`), tracks account credit consumption, and routes requests to specialized backend workers.
4. **Search Aggregator & Stealth Browser Pool:** Queries live search engines and provisions headless Chromium instances to render complex JavaScript applications.
5. **Markdown & Extraction Engine:** Transforms raw DOM subtrees into semantic Markdown, maintaining table structures, code blocks, and source URLs.

---

## 7. Step-by-Step Data Workflow

The life cycle of a live search and documentation retrieval request follows a clean 8-step execution path:

1. **Developer Prompting:** Developer submits a prompt in Cursor Chat: *"How do I use React 19 useActionState hook?"*
2. **Agent Reasoner:** Cursor's LLM determines it requires external knowledge. It selects the registered `search` MCP tool.
3. **Local JSON-RPC Issue:** Cursor writes a `tools/call` JSON-RPC message over standard input (`stdin`) to the local `ollagraph-mcp` process.
4. **API Gateway Dispatch:** `ollagraph-mcp` attaches your API key and issues an authenticated HTTPS POST request to `api.ollagraph.com`.
5. **Search & Page Fetch:** Ollagraph runs a multi-engine search and returns ranked result URLs; the agent then calls a fetch tool such as `scrape_llm_ready` or `extract_clean` on the most relevant documentation URL.
6. **Dynamic JS Rendering & Parsing:** If target pages require JavaScript, stealth headless Chromium renders the DOM. The engine strips HTML noise and converts output to structured Markdown.
7. **JSON-RPC Response Return:** Ollagraph returns the payload to `ollagraph-mcp`, which streams it to Cursor's standard output (`stdout`).
8. **Prompt Context Ingestion:** Cursor injects the retrieved Markdown into the LLM context window. The agent synthesizes the code solution, complete with grounded source citations.

---

## 8. System Configuration Guide

Configuring Cursor IDE to connect to Ollagraph takes less than two minutes across macOS, Linux, and Windows environments.

### Prerequisites
Before starting, ensure you have:
- Cursor IDE (v0.45.0 or newer).
- Python 3.10+ with [pipx](https://pipx.pypa.io) installed (no Node.js needed—the server is the `ollagraph-mcp` package on PyPI).
- Ollagraph API Key (Obtain your `osk_...` key from the [Ollagraph Dashboard](https://ollagraph.com)).

### Option A: Workspace Configuration (Recommended)
Workspace configuration ensures everyone on your team shares the exact same MCP tools when working on a repository.

1. Open your project root directory in Cursor.
2. Create a folder named `.cursor` in the project root if it does not already exist:
   ```bash
   mkdir -p .cursor
   touch .cursor/mcp.json
   ```
3. Add the following JSON configuration:
   ```json
   {
     "mcpServers": {
       "ollagraph": {
         "command": "pipx",
         "args": ["run", "ollagraph-mcp"],
         "env": {
           "OLLAGRAPH_API_KEY": "osk_..."
         }
       }
     }
   }
   ```

### Option B: Global Cursor Configuration
If you want Ollagraph available across every repository you open in Cursor:

1. Open Cursor IDE.
2. Navigate to **Cursor Settings -> Features -> MCP Servers**.
3. Click **+ Add New MCP Server**.
4. Fill in the form fields:
   - **Name:** `ollagraph`
   - **Type:** `stdio`
   - **Command:** `pipx run ollagraph-mcp`
   - **Environment Variables:** Set `OLLAGRAPH_API_KEY` to your `osk_...` key.

Alternatively, put the same JSON shown in Option A into Cursor's global configuration file, `~/.cursor/mcp.json` (on Windows, `%USERPROFILE%\.cursor\mcp.json`).

### Option C: Windows WSL2 & PowerShell Configuration
On Windows 11 environments using Windows Subsystem for Linux (WSL2), make sure `pipx` resolves on the `PATH` that Cursor's process sees, to prevent path resolution failures between Windows host processes and Ubuntu environments.

#### Native Windows Setup (`%USERPROFILE%\.cursor\mcp.json`)
```json
{
  "mcpServers": {
    "ollagraph": {
      "command": "pipx",
      "args": ["run", "ollagraph-mcp"],
      "env": {
        "OLLAGRAPH_API_KEY": "osk_..."
      }
    }
  }
}
```

#### WSL2 Ubuntu Setup (`~/.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "ollagraph": {
      "command": "/usr/bin/pipx",
      "args": ["run", "ollagraph-mcp"],
      "env": {
        "OLLAGRAPH_API_KEY": "osk_...",
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
      }
    }
  }
}
```

---

## 9. Production Code Examples & Scenarios

Below are production configurations demonstrating server tuning, programmatic MCP client integration, and tool verification.

### Example 1: Tuning the Server with Environment Variables (`.cursor/mcp.json`)
`ollagraph-mcp` reads three environment variables: `OLLAGRAPH_API_KEY` (required), `OLLAGRAPH_API_URL` (defaults to `https://api.ollagraph.com`) and `OLLAGRAPH_TIMEOUT_SECONDS` (per-tool-call HTTP timeout, default 60). It always registers every endpoint; there are no allow/deny flags. To keep the context window focused on search, web scraping, and document conversion, switch off tools you don't need in your client's MCP settings if it supports per-tool toggles.

```json
{
  "mcpServers": {
    "ollagraph": {
      "command": "pipx",
      "args": ["run", "ollagraph-mcp"],
      "env": {
        "OLLAGRAPH_API_KEY": "osk_...",
        "OLLAGRAPH_TIMEOUT_SECONDS": "90"
      }
    }
  }
}
```

### Example 2: Programmatic TypeScript MCP Client Integration (`client-mcp-bridge.ts`)
If you are building custom developer CLI extensions or internal developer tooling that invokes Ollagraph MCP programmatically with the official MCP TypeScript SDK:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function initializeOllagraphBridge() {
  // 1. Configure local Stdio Transport launching Ollagraph MCP
  const transport = new StdioClientTransport({
    command: "pipx",
    args: ["run", "ollagraph-mcp"],
    env: {
      OLLAGRAPH_API_KEY: process.env.OLLAGRAPH_API_KEY || "osk_your_key_here",
    },
  });

  // 2. Initialize MCP Client
  const client = new Client(
    { name: "custom-cursor-bridge", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  await client.connect(transport);
  console.log("Connected to Ollagraph MCP Server successfully.");

  // 3. Query Available Web Tools
  const { tools } = await client.listTools();
  console.log(`Discovered ${tools.length} available web intelligence tools.`);

  // 4. Execute Multi-Engine Live Search
  const searchResult = await client.callTool({
    name: "search",
    arguments: {
      query: "Next.js 15 Server Actions breaking changes",
      limit: 5,
    },
  });

  console.log("Search Result Context:", searchResult.content[0].text);
}

initializeOllagraphBridge().catch(console.error);
```

### Example 3: Verifying Active Tool Discovery in Cursor Chat
Once configured, restart Cursor or click the **Refresh** button under **Cursor Settings -> Features -> MCP Servers**.

Open Cursor Chat (`Cmd+L` or `Ctrl+L`) and switch to **Agent Mode**. Test the setup with this prompt:

```text
/search Find the breaking changes in Pydantic v2.10 and write a python migration example for our user model.
```

Cursor will invoke Ollagraph's web tool autonomously:
```text
[Tool Call Executed] -> search({"query": "Pydantic v2.10 breaking changes", "limit": 5})
[Tool Call Executed] -> scrape_llm_ready({"url": "https://docs.pydantic.dev/2.10/migration/"})
[Reading Live Context] -> Ingested https://docs.pydantic.dev/2.10/migration/
[Generating Code] -> Outputting fully updated Python code based on live documentation.
```

---

## 10. Performance Benchmarks & Optimization

We haven't published benchmark figures for this setup. Latency depends on the target site, whether a page needs JavaScript rendering, and how many tool calls the agent chains together. To evaluate it for your team, run the same set of developer questions with and without the server and compare time-to-correct-answer and the number of tokens pulled into context.

### Context Window Optimization Tips
- **Fetch Pages as LLM-Ready Chunks:** Prefer the `scrape_llm_ready` tool (with `max_tokens` set) over raw HTML scrapes so each page arrives as clean, size-bounded text.
- **Limit Search Results:** When querying search tools inside Cursor prompt rules, instruct the agent to pass a small `limit` (3 to 5) and fetch only the one or two most relevant pages to keep prompt context focused.

---

## 11. Security, Zero Trust & Compliance

Connecting developer tools to external APIs requires clear security controls. Put these in place for your MCP traffic:

### 1. Workstation & Secret Isolation
Never hardcode your `OLLAGRAPH_API_KEY` directly inside shared project repositories. Always store keys in environment variables or local, uncommitted `.cursor/mcp.json` files included in your `.gitignore` rules.

### 2. Client Data Loss Prevention (DLP) Filter Script (`dlp-sanitizer.js`)
Incorporate this local middleware script to automatically scrub sensitive corporate patterns from outbound prompt payloads before they reach the web tool network bridge:

```javascript
/**
 * Enterprise DLP Payload Sanitizer for MCP Tool Arguments
 */
const DLP_PATTERNS = [
  { name: "JWT Token", regex: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g },
  { name: "Database URL", regex: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+\/[^\s]+/g },
  { name: "AWS Key ID", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "Generic Secret", regex: /(secret|password|bearer|token)\s*=\s*['"][^'"]+['"]/gi },
  { name: "Ollagraph Key", regex: /osk_[0-9a-f]{48}/g }
];

function sanitizeMCPArgument(argValue) {
  if (typeof argValue !== "string") return argValue;
  
  let cleanedText = argValue;
  for (const pattern of DLP_PATTERNS) {
    if (pattern.regex.test(cleanedText)) {
      console.warn(`[DLP ALERT] Sanitized sensitive ${pattern.name} from MCP tool call payload.`);
      cleanedText = cleanedText.replace(pattern.regex, `[REDACTED_${pattern.name.toUpperCase().replace(/\s+/g, '_')}]`);
    }
  }
  return cleanedText;
}

module.exports = { sanitizeMCPArgument };
```

### 3. Egress Allowlisting
Ollagraph is a public HTTPS API; there is no private tunnel or dedicated enterprise gateway. If your workstations sit behind an allowlist-based firewall, allow outbound HTTPS (port 443) to `api.ollagraph.com`. The MCP server fetches the OpenAPI spec from that host at startup and sends every tool call there, so that one host is all it needs. If `pipx run` has to download the package, it also needs access to PyPI.

### 4. Zero Persistent Data Retention Architecture
Content fetched and transformed by Ollagraph (scraped web pages, converted PDFs, extracted JSON) is processed entirely in ephemeral RAM buffers. Content is never written to persistent disk storage or used to train public machine learning models.

---

## 12. Troubleshooting & Log Diagnostics

If Cursor fails to discover tools or display the green active status indicator next to `ollagraph`, follow these diagnostic steps.

### Step-by-Step Diagnostic Inspection

#### Step 1: Inspect Cursor MCP Log Stream
1. Open Cursor IDE.
2. Navigate to **Output Panel** (`Cmd+Shift+U` or `Ctrl+Shift+U`).
3. Select **Model Context Protocol** or **Cursor Agent** from the dropdown menu.
4. Look for the `ollagraph` server starting, its tool list being loaded, and any error text the process printed.

#### Step 2: Test `ollagraph-mcp` Directly via CLI
Open your terminal and run the server manually:
```bash
export OLLAGRAPH_API_KEY="osk_..."
pipx run ollagraph-mcp
```

If the server is working, it will wait quietly for standard input. If it exits instead, read the message: `OLLAGRAPH_API_KEY is not set` means the key never reached the process, and `cannot fetch OpenAPI spec` means it couldn't reach `api.ollagraph.com`.

To list and call the tools without Cursor, open the official MCP Inspector (a Node.js tool) against the same command:
```bash
npx @modelcontextprotocol/inspector pipx run ollagraph-mcp
```

---

## 13. Engineering Best Practices

Follow these production guidelines when integrating MCP web tools into team workflows:

- **Always Add `.cursor/mcp.json` to `.gitignore`:** Prevent accidental commits of developer API keys by adding `.cursor/mcp.json` to your global or project `.gitignore` file.
- **Use Workspace Templates:** Commit an `.cursor/mcp.json.template` file to your team's Git repository:
  ```json
  {
    "mcpServers": {
      "ollagraph": {
        "command": "pipx",
        "args": ["run", "ollagraph-mcp"],
        "env": {
          "OLLAGRAPH_API_KEY": "${OLLAGRAPH_API_KEY}"
        }
      }
    }
  }
  ```
- **Define System Prompt Guidelines:** Add a `.cursorrules` file to your project root to instruct Cursor when and how to invoke web search:
  ```markdown
  # .cursorrules - Web Search Execution Guidelines
  When asked about external libraries, API syntax, or error codes:
  1. Use the `search` tool to find live documentation, then `scrape_llm_ready` to read the best page.
  2. Always ground your code answers using the Markdown returned from Ollagraph.
  3. Include inline source URL comments pointing to the retrieved documentation.
  ```

---

## 14. Common Mistakes & Anti-Patterns

- **❌ Anti-Pattern 1: Hardcoding API Keys in Public Repositories**  
  *Consequence:* Exposes your account credits to public automated key scanners.  
  *Solution:* Store API keys in environment variables or uncommitted `.cursor/mcp.json` files.
- **❌ Anti-Pattern 2: Running Multiple Redundant Search MCP Servers**  
  *Consequence:* Having Tavily, Firecrawl, and Ollagraph MCP servers running simultaneously confuses Cursor's tool router, leading to high latency and redundant search calls.  
  *Solution:* Consolidate on Ollagraph, which handles search, JS rendering, PDF parsing, and structured extraction in a single server.
- **❌ Anti-Pattern 3: Requesting Raw HTML Payload Ingestion**  
  *Consequence:* Wastes context tokens and slows down model reasoning.  
  *Solution:* Always use Ollagraph's default Markdown extraction endpoints (`/v1/scrape/llm-ready`).

---

## 15. Alternative Solutions & Trade-offs

Developers needing live web context inside Cursor IDE generally consider four paths:

1. **Manual Browser Copy-Paste:** Free, but slow, inefficient, and pollutes token context with unparsed HTML noise.
2. **Naive IDE Scraping Plugins:** Cheap, but fails on 80%+ of dynamic JavaScript portals and Cloudflare-protected sites.
3. **Custom Playwright/Puppeteer Scripts:** Flexible, but requires maintaining local browser clusters, managing proxy rotations, and handling CAPTCHA solvers yourself.
4. **Ollagraph MCP Integration (Recommended):** Fully managed cloud infrastructure, every Ollagraph endpoint as a tool, stealth browser rendering, refunds on failed calls, and 2-minute setup.

---

## 16. Comprehensive Comparison Tables

| Feature / Metric | Ollagraph MCP | Manual Copy-Paste | Naive IDE Plugins | Firecrawl MCP |
| :--- | :--- | :--- | :--- | :--- |
| **Setup Speed** | Under 2 minutes (`pipx run ollagraph-mcp`) | Wastes developer time | 5+ minutes | 5+ minutes |
| **Live Web Search** | Unified multi-engine real-time search | Slow manual search | No search | No search |
| **JS / SPA Rendering** | Stealth Chromium rendering | Manual browser render | Fails on JS/SPAs | Heavy credit multipliers |
| **Document Parsing** | Text-layer PDFs, DOCX, XLSX, PPTX to Markdown (no OCR) | Manual copy | None | Basic PDF only |
| **Security Recon** | Domain intel endpoints (WHOIS, DNS, SSL, WAF) | None | None | None |
| **Tool Ecosystem** | Every Ollagraph endpoint as a tool | 0 | 1 | 5–10 |
| **Predictable Billing** | Per-endpoint credit costs + refunds on failed calls | N/A | Variable / Subscription | Complex multipliers |
| **Data Privacy** | Zero Persistent Data Retention (RAM only) | Local only | Varies | Logs retained |

---

## 17. Enterprise Deployment Architecture

For enterprise engineering teams operating behind strict corporate firewalls, VPNs, or SD-WAN networks (such as WireGuard or Cloudflare Zero Trust), keep the deployment simple: Ollagraph does not offer a hosted or self-hosted MCP gateway. Each developer's Cursor runs its own local `ollagraph-mcp` process over stdio, and every tool call goes out as HTTPS to `api.ollagraph.com`.

That means the controls that matter are:
- **Network:** allow outbound HTTPS to `api.ollagraph.com` (and PyPI, if `pipx` needs to download the package).
- **Keys:** issue one API key per developer or environment so usage can be attributed and capped (see the FAQ below).
- **Version pinning:** if you need reproducible installs, pin the package version, e.g. `pipx run --spec ollagraph-mcp==<version> ollagraph-mcp`, or install it from an internal PyPI mirror.

---

## 18. Cloud & Container Deployment

To run `ollagraph-mcp` from a container instead of a local Python install, build a small image and let Cursor launch it with `docker run -i` so stdio stays attached:

### Container Image (`Dockerfile`)

```dockerfile
FROM python:3.12-slim
RUN pip install --no-cache-dir ollagraph-mcp
ENTRYPOINT ["ollagraph-mcp"]
```

Build it once with `docker build -t ollagraph-mcp-local .`

### Cursor Configuration (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "ollagraph": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "OLLAGRAPH_API_KEY", "ollagraph-mcp-local"],
      "env": {
        "OLLAGRAPH_API_KEY": "osk_..."
      }
    }
  }
}
```

---

## 19. Frequently Asked Questions

### Q1: How does Cursor IDE know when to use the Ollagraph MCP tool?
Cursor's agent continuously evaluates prompt context. When your request references external documentation, recent software libraries, or explicit search commands (such as `/search`), the LLM selects the registered `search` tool dynamically based on its registered JSON Schema.

### Q2: What is the cost of connecting Cursor to Ollagraph MCP?
The MCP server itself is free and open source. Each tool call is billed in credits at the cost of the endpoint behind it, and costs vary by endpoint—check the pricing page, or call `POST /v1/me/cost-estimate` for a specific endpoint. If a call fails, its credits are refunded automatically.

### Q3: Does Ollagraph store my scraped code or documentation searches?
No. Ollagraph adheres to a strict zero persistent data retention architecture. Scraped web pages and extracted text are processed in volatile memory and returned directly to Cursor over encrypted TLS 1.3 channels. No content is stored on disk or used for AI model training.

### Q4: Can I use Ollagraph MCP on Windows, macOS, and Linux?
Yes. The `ollagraph-mcp` server is a Python package (Python 3.10+), so it runs anywhere Python and `pipx` do, including macOS (Intel/Apple Silicon), Linux (Ubuntu, Debian, Fedora), and Windows (native PowerShell or WSL2).

### Q5: What is the difference between stdio and SSE transport modes?
`stdio` (Standard Input/Output) launches `ollagraph-mcp` as a local subprocess directly managed by Cursor IDE. `SSE` (Server-Sent Events) and the newer HTTP transports connect a client to a remote MCP server over HTTP. Ollagraph does not host a remote MCP endpoint, so stdio is how you connect.

### Q6: What happens if a web page requires client-side JavaScript rendering?
Ollagraph automatically detects target page complexity. If a site requires client-side JavaScript execution, Ollagraph routes the request through stealth headless Chromium browser pools—executing JS and returning clean Markdown without additional configuration.

### Q7: Can Ollagraph parse PDF documentation files directly into Cursor?
Yes, for PDFs that have a text layer. The `convert_pdf_to_markdown` tool takes the file as base64-encoded bytes (`pdf_base64`, plus an optional `max_pages`), not a URL, and returns Markdown with one section per page. There is no OCR: scanned, image-only PDFs come back flagged with `likely_scanned_pdf: true`.

### Q8: How do I update the `ollagraph-mcp` package to the latest version?
`pipx run ollagraph-mcp` uses a cached copy that pipx refreshes periodically. To force the latest release, run `pipx run --no-cache ollagraph-mcp` once. If you installed it with pip instead, run `pip install -U ollagraph-mcp`.

### Q9: Can I run Ollagraph MCP in isolated, air-gapped private cloud VPCs?
No. Ollagraph is a hosted API at `api.ollagraph.com`; there is no private-VPC or self-hosted deployment. The MCP server runs locally, but every tool call goes to the hosted API, so the host needs outbound HTTPS access to `api.ollagraph.com`.

### Q10: How do enterprise engineering managers manage monthly credit quotas across developer teams?
Account administrators create a separate API key per developer, team, or environment (in the Ollagraph Dashboard or via `POST /v1/keys`). Each key can carry a label, a project tag, and an optional daily credit cap, and usage can be reviewed in the dashboard.

---

## 20. Technical References & Citations

- **Anthropic Model Context Protocol (MCP) Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Cursor IDE Feature Documentation & Settings:** [docs.cursor.com/context/model-context-protocol](https://docs.cursor.com/context/model-context-protocol)
- **Ollagraph Official API & MCP Documentation:** [ollagraph.com/docs](https://ollagraph.com/docs)
- **JSON-RPC 2.0 Specification Standard:** [jsonrpc.org/specification](https://www.jsonrpc.org/specification)
- **IETF RFC 6455 - The WebSocket & SSE Transport Protocol:** [datatracker.ietf.org/doc/html/rfc6455](https://datatracker.ietf.org/doc/html/rfc6455)

---

## 21. Conclusion & Next Action Steps

Connecting Cursor IDE to Ollagraph's MCP server transforms your editor into a real-time development engine. By grounding Cursor's agent with live multi-engine search, clean Markdown parsing, and stealth browser rendering, you eliminate outdated code hallucinations and streamline your software engineering workflow.

### Recommended Next Steps for Developers
1. **Get Your API Key:** Log into [Ollagraph.com](https://ollagraph.com) and copy your key (`osk_...`).
2. **Create Your Config:** Add `.cursor/mcp.json` to your primary project repository using the standard `pipx run ollagraph-mcp` configuration (see the [MCP setup page](https://ollagraph.com/mcp/)).
3. **Test in Agent Mode:** Open Cursor Chat (`Cmd+L` / `Ctrl+L`) and run `/search [your technology stack]` to experience real-time, grounded AI coding!
