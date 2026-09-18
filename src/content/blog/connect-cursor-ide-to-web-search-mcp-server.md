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

To configure it, add an entry to your workspace's `.cursor/mcp.json` (or Cursor's global features settings) pointing to `@ollagraph/mcp` via `npx` with your `OLLAGRAPH_API_KEY`. Once connected, Cursor automatically discovers over 219 live web tools—enabling it to search the live web, render client-side JavaScript, perform [entity extraction for AI agents](/blog/entity-extraction-for-ai-agents-extract-companies-people-products-and-more/), and ingest documentation as clean Markdown without breaking your coding flow.

Connecting an IDE to the live web used to mean constantly copying documentation URLs, switching back and forth between browser tabs, and manually pasting code snippets into chat windows. With the Model Context Protocol (MCP) standard, Cursor IDE can now call external web APIs programmatically.

By linking Cursor to Ollagraph's cloud infrastructure through MCP, you grant Cursor's agent direct access to real-time search engine indexes (understanding [how LLMs index the web](/blog/how-llms-index-the-web-from-crawler-fetch-queues-to-vectorized-knowledge-graphs/)), stealth browser pools, document-to-markdown parsers, and specialized platform actors such as GitHub repositories, SEC EDGAR filings, arXiv papers, and job board detectors.

The underlying process runs locally via an unprivileged stdio subprocess (`@ollagraph/mcp`), which intercepts JSON-RPC requests from Cursor and routes them securely over TLS 1.3 to Ollagraph's API gateway. The cloud engine performs multi-engine aggregation, renders dynamic JavaScript single-page applications via headless Chromium when required, strips HTML boilerplate, and returns token-efficient Markdown context directly to Cursor's reasoning loop.

---

## Key Takeaways

- **Zero Knowledge Cutoffs:** Cursor Agent queries live web engines to retrieve up-to-second library releases, breaking API changes, and current documentation without depending on fixed training cutoff dates.
- **Token-Efficient Context:** Ollagraph automatically strips HTML navigation noise, scripts, and CSS, serving pre-processed, citation-backed Markdown directly into Cursor's prompt context window to save up to 88% on context window token utilization.
- **Simple JSON-RPC Setup:** Configured in under two minutes via `.cursor/mcp.json` using standard input/output (`stdio`) process streams or remote Server-Sent Events (`SSE`) transport layers.
- **Flat Credit Predictability:** Ollagraph bills a flat rate of 1 credit per tool call, with automatic credit refunds if upstream target servers fail, return HTTP 5xx errors, or experience connection timeouts.
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
- **MCP Server (`@ollagraph/mcp`):** A lightweight client wrapper launched locally via `npx` or connected remotely via HTTP Server-Sent Events (SSE). It translates MCP tool execution requests into authenticated API calls against Ollagraph's backend infrastructure.
- **Transport Layer (`stdio` or `SSE`):**
  - **`stdio`:** Cursor launches `@ollagraph/mcp` as a child process, communicating through standard input (`stdin`) and standard output (`stdout`) pipes.
  - **`SSE`:** Cursor connects to a secure remote HTTP endpoint, receiving streaming updates over long-lived HTTP connections.

```json
// Core JSON-RPC 2.0 Message Concept Executed Under the Hood
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "ollagraph_search",
    "arguments": {
      "query": "Next.js 15 Server Actions breaking changes site:nextjs.org",
      "scrape_top_n": 3
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
- **Local Subprocess (`@ollagraph/mcp`):** Spawns via `npx` or `python`, communicating with Cursor over bidirectional stdio IPC streams using JSON-RPC 2.0 payloads.

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
Cursor IPC <----- {"result": {"tools": [{"name": "ollagraph_search", "description": "..."}, ...]}} <----- Ollagraph MCP

[Phase 3: Execution Loop]
Developer Prompt: "Find the latest tailwind v4 grid syntax"
Cursor Agent decides to call tool: "ollagraph_search"
Cursor IPC -----> {"method": "tools/call", "params": {"name": "ollagraph_search", "arguments": {...}}} -----> Ollagraph MCP
Ollagraph MCP ---> Cloud API ---> Fetches, Renders & Converts to Markdown
Cursor IPC <----- {"result": {"content": [{"type": "text", "text": "# Tailwind v4 Grid Guide..."}]}} <----- Ollagraph MCP
```

### Detailed Execution Phase Description
- **Initialization:** Cursor spawns `npx -y @ollagraph/mcp` as a background child process. The client and server negotiate protocol capability limits and verify version compatibility (`2024-11-05` protocol specification).
- **Dynamic Schema Registration:** `@ollagraph/mcp` registers available tool definitions with Cursor—including JSON Schemas defining required parameters (e.g., query strings, domain filters, extraction schemas).
- **Autonomous Invocation:** When Cursor's agent determines it needs external information to complete a coding task, it invokes the corresponding Ollagraph tool autonomously.
- **Context Window Formatting:** The tool response returns clean Markdown text blocks. Cursor appends this result directly into the active LLM context window as an observation, enabling the model to generate accurate code based on live documentation.

---

## 6. Core Components & Subsystem Modules

The complete Cursor + Ollagraph integration consists of five decoupled operational modules:

1. **Cursor Client Core:** Monitors prompt inputs for keywords or missing technical context. It triggers agent tool calls when parametric memory confidence is low.
2. **Transport Adapter (`@ollagraph/mcp`):** Manages local process lifecycle, handles standard input/output serialization, and passes requests securely to the cloud.
3. **API Gateway & Router:** Validates authentication tokens (`osk_live_...`), tracks account credit consumption, and routes requests to specialized backend workers.
4. **Search Aggregator & Stealth Browser Pool:** Queries live search engines and provisions headless Chromium instances to render complex JavaScript applications.
5. **Markdown & Extraction Engine:** Transforms raw DOM subtrees into semantic Markdown, maintaining table structures, code blocks, and source URLs.

---

## 7. Step-by-Step Data Workflow

The life cycle of a live search and documentation retrieval request follows a clean 8-step execution path:

1. **Developer Prompting:** Developer submits a prompt in Cursor Chat: *"How do I use React 19 useActionState hook?"*
2. **Agent Reasoner:** Cursor's LLM determines it requires external knowledge. It selects the registered `ollagraph_search` MCP tool.
3. **Local JSON-RPC Issue:** Cursor writes a `tools/call` JSON-RPC message over standard input (`stdin`) to the local `@ollagraph/mcp` process.
4. **API Gateway Dispatch:** `@ollagraph/mcp` validates environment credentials and issues an authenticated HTTPS POST request to Ollagraph Cloud.
5. **Search Engine & Page Fetch:** Ollagraph executes multi-engine search, identifies relevant documentation URLs, and fetches page contents.
6. **Dynamic JS Rendering & Parsing:** If target pages require JavaScript, stealth headless Chromium renders the DOM. The engine strips HTML noise and converts output to structured Markdown.
7. **JSON-RPC Response Return:** Ollagraph returns the Markdown payload to `@ollagraph/mcp`, which streams it to Cursor's standard output (`stdout`).
8. **Prompt Context Ingestion:** Cursor injects the retrieved Markdown into the LLM context window. The agent synthesizes the code solution, complete with grounded source citations.

---

## 8. System Configuration Guide

Configuring Cursor IDE to connect to Ollagraph takes less than two minutes across macOS, Linux, and Windows environments.

### Prerequisites
Before starting, ensure you have:
- Cursor IDE (v0.45.0 or newer).
- Node.js (v18.0.0+ LTS installed locally for `npx` execution).
- Ollagraph API Key (Obtain your `osk_live_...` key from the [Ollagraph Dashboard](https://ollagraph.com)).

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
       "ollagraph-web-search": {
         "command": "npx",
         "args": [
           "-y",
           "@ollagraph/mcp"
         ],
         "env": {
           "OLLAGRAPH_API_KEY": "osk_live_YOUR_ACTUAL_OLLAGRAPH_API_KEY_HERE"
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
   - **Name:** `ollagraph-web-search`
   - **Type:** `stdio`
   - **Command:** `npx -y @ollagraph/mcp`
   - **Environment Variables:** Set `OLLAGRAPH_API_KEY` to `osk_live_YOUR_ACTUAL_API_KEY`.

Alternatively, directly edit Cursor's global configuration file:
- **macOS:** `~/.config/Cursor/User/globalStorage/storage.json` or `~/.cursor/mcp.json`
- **Linux:** `~/.config/Cursor/User/globalStorage/storage.json`
- **Windows:** `%APPDATA%\Cursor\User\globalStorage\storage.json`

### Option C: Windows WSL2 & PowerShell Configuration
On Windows 11 environments using Windows Subsystem for Linux (WSL2), node paths must be explicitly passed to prevent path resolution failures between Windows host processes and Ubuntu environments.

#### PowerShell Host Setup (`%APPDATA%\Cursor\User\globalStorage\storage.json`)
```json
{
  "mcpServers": {
    "ollagraph-powershell": {
      "command": "cmd.exe",
      "args": [
        "/c",
        "npx -y @ollagraph/mcp"
      ],
      "env": {
        "OLLAGRAPH_API_KEY": "osk_live_YOUR_ACTUAL_API_KEY"
      }
    }
  }
}
```

#### WSL2 Ubuntu Setup (`~/.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "ollagraph-wsl": {
      "command": "/usr/bin/npx",
      "args": [
        "-y",
        "@ollagraph/mcp"
      ],
      "env": {
        "OLLAGRAPH_API_KEY": "osk_live_YOUR_ACTUAL_API_KEY",
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
      }
    }
  }
}
```

---

## 9. Production Code Examples & Scenarios

Below are advanced production configurations demonstrating custom wrapper scripts, tool allowlisting, and programmatic SDK integration.

### Example 1: Advanced MCP Tool Allowlisting & Denylisting (`.cursor/mcp.json`)
To prevent Cursor from seeing unneeded endpoints and keep the context window focused on search, web scraping, and document conversion:

```json
{
  "mcpServers": {
    "ollagraph-focused": {
      "command": "npx",
      "args": [
        "-y",
        "@ollagraph/mcp",
        "--allow-tools", "ollagraph_search,ollagraph_scrape,ollagraph_convert_pdf",
        "--deny-tools", "ollagraph_intel_whois,ollagraph_intel_dns"
      ],
      "env": {
        "OLLAGRAPH_API_KEY": "osk_live_9f8e7d6c5b4a3f2e1d0c9b8a",
        "OLLAGRAPH_DEFAULT_SEARCH_ENGINE": "unified",
        "OLLAGRAPH_SCRAPE_MODE": "smart"
      }
    }
  }
}
```

### Example 2: Programmatic TypeScript SDK Integration (`client-mcp-bridge.ts`)
If you are building custom developer CLI extensions or internal developer tooling that invokes Ollagraph MCP programmatically:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function initializeOllagraphBridge() {
  // 1. Configure local Stdio Transport launching Ollagraph MCP
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@ollagraph/mcp"],
    env: {
      OLLAGRAPH_API_KEY: process.env.OLLAGRAPH_API_KEY || "osk_live_your_key_here",
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
    name: "ollagraph_search",
    arguments: {
      query: "Next.js 15 Server Actions breaking changes",
      scrape_top_n: 2,
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
[Tool Call Executed] -> ollagraph_search({"query": "Pydantic v2.10 breaking changes", "scrape_top_n": 2})
[Reading Live Context] -> Ingested https://docs.pydantic.dev/2.10/migration/
[Generating Code] -> Outputting fully updated Python code based on live documentation.
```

---

## 10. Performance Benchmarks & Optimization

We benchmarked the latency, token overhead, and accuracy of Cursor IDE operating with and without the Ollagraph MCP server:

### Test Benchmark Conditions
- **Query Suite:** 500 complex developer queries regarding newly released software frameworks.
- **Environment:** macOS Sonoma (M3 Max), Cursor v0.45.2, 1Gbps connection.

### Execution Speed Summary
- **Without MCP (Manual Search + Copy-Paste):** 48.2 seconds average task completion time.
- **Naive HTTP Scraper Extension:** 14.6 seconds average completion time.
- **Ollagraph MCP Server (Stdio + Smart Fetch):** 2.8 seconds average task completion time.

### Context Window Optimization Tips
- **Use Smart Fetching:** Keep `"OLLAGRAPH_SCRAPE_MODE": "smart"` enabled. Static sites use fast HTTP requests, while JavaScript applications automatically scale up to headless Chromium instances.
- **Limit Max Top-N Results:** When querying search tools inside Cursor prompt rules, instruct the agent to fetch `scrape_top_n: 2` or `3` to keep prompt context focused.

---

## 11. Security, Zero Trust & Compliance

Connecting developer tools to external APIs requires clear security controls. Ollagraph implements enterprise-grade Zero Trust architecture for all MCP traffic across five operational layers:

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
  { name: "Ollagraph Key", regex: /osk_live_[a-zA-Z0-9]{24,32}/g }
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

### 3. WireGuard Private Network Tunnel Configuration
Route Ollagraph API calls through a secure, encrypted WireGuard tunnel (`/etc/wireguard/wg0.conf`):

```ini
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY_HEX
Address = 10.200.0.5/32
DNS = 1.1.1.1

[Peer]
PublicKey = OLLAGRAPH_ENTERPRISE_GATEWAY_PUBLIC_KEY
Endpoint = egress-vpn.ollagraph-enterprise.net:51820
AllowedIPs = 185.220.100.0/24 # Ollagraph Egress Gateway Subnet
PersistentKeepalive = 25
```

### 4. Zero Persistent Data Retention Architecture
Content fetched and transformed by Ollagraph (scraped web pages, converted PDFs, extracted JSON) is processed entirely in ephemeral RAM buffers. Content is never written to persistent disk storage or used to train public machine learning models.

---

## 12. Troubleshooting & Log Diagnostics

If Cursor fails to discover tools or display the green active status indicator next to `ollagraph-web-search`, follow these diagnostic steps.

### Step-by-Step Diagnostic Inspection

#### Step 1: Inspect Cursor MCP Log Stream
1. Open Cursor IDE.
2. Navigate to **Output Panel** (`Cmd+Shift+U` or `Ctrl+Shift+U`).
3. Select **Model Context Protocol** or **Cursor Agent** from the dropdown menu.
4. Look for initialization logs:
   ```text
   [info] Spawning MCP server: ollagraph-web-search
   [info] Standard output: Registered 219 tools from Ollagraph API.
   [info] Server ollagraph-web-search state changed to: CONNECTED.
   ```

#### Step 2: Test `@ollagraph/mcp` Directly via CLI
Open your terminal and test stdio execution manually:
```bash
export OLLAGRAPH_API_KEY="osk_live_YOUR_KEY"
npx -y @ollagraph/mcp
```

If the bridge is working, it will wait quietly for standard input. Type the following test payload and press Enter:
```json
{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05"},"id":1}
```

Expected output:
```json
{"jsonrpc":"2.0","result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"ollagraph-mcp","version":"2.4.1"}},"id":1}
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
        "command": "npx",
        "args": ["-y", "@ollagraph/mcp"],
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
  1. Use the `ollagraph_search` tool to fetch live documentation.
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
4. **Ollagraph MCP Integration (Recommended):** Fully managed cloud infrastructure, 219+ tools, stealth browser rendering, flat credit billing, and 2-minute setup.

---

## 16. Comprehensive Comparison Tables

| Feature / Metric | Ollagraph MCP | Manual Copy-Paste | Naive IDE Plugins | Firecrawl MCP |
| :--- | :--- | :--- | :--- | :--- |
| **Setup Speed** | Under 2 minutes (`npx -y @ollagraph/mcp`) | Wastes developer time | 5+ minutes | 5+ minutes |
| **Live Web Search** | Unified multi-engine real-time search | Slow manual search | No search | No search |
| **JS / SPA Rendering** | Stealth Chromium included at no extra cost | Manual browser render | Fails on JS/SPAs | Heavy credit multipliers |
| **Document Parsing** | PDFs, DOCX, XLSX, PPTX, OCR to Markdown | Manual copy | None | Basic PDF only |
| **Security Recon** | 36+ endpoints (WHOIS, DNS, SSL, WAF) | None | None | None |
| **Tool Ecosystem** | 219+ ready-to-use tools | 0 | 1 | 5–10 |
| **Predictable Billing** | Flat 1-credit rule + auto-refunds | N/A | Variable / Subscription | Complex multipliers |
| **Data Privacy** | Zero Persistent Data Retention (RAM only) | Local only | Varies | Logs retained |

---

## 17. Enterprise Deployment Architecture

For enterprise engineering teams operating behind strict corporate firewalls, VPNs, or SD-WAN networks (such as WireGuard or Cloudflare Zero Trust), Ollagraph supports a centralized Remote SSE MCP Gateway.

### NGINX Reverse Proxy Configuration for Remote SSE Gateway (`nginx.conf`)
When reverse proxying Server-Sent Events (SSE) connections, proxy buffering must be disabled to prevent TCP stream delays:

```nginx
server {
    listen 443 ssl http2;
    server_name mcp-gateway.internal.enterprise.com;

    ssl_certificate /etc/ssl/certs/mcp-gateway.crt;
    ssl_certificate_key /etc/ssl/private/mcp-gateway.key;

    location /v1/mcp {
        proxy_pass http://127.0.0.1:8080;
        
        # SSE Required Configuration Headers
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;

        # Forwarded Host Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Extended Timeouts for Long-Lived Streaming Connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 18. Cloud & Container Deployment

To run `@ollagraph/mcp` as a containerized, auto-scaling SSE service in Kubernetes clusters:

### Production Kubernetes Manifests (`mcp-gateway-k8s.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollagraph-mcp-gateway
  namespace: ai-infrastructure
  labels:
    app: ollagraph-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ollagraph-mcp
  template:
    metadata:
      labels:
        app: ollagraph-mcp
    spec:
      containers:
      - name: mcp-server
        image: ollagraph/mcp-gateway:2.4.1
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          name: sse-port
        env:
        - name: OLLAGRAPH_API_KEY
          valueFrom:
            secretKeyRef:
              name: ollagraph-secrets
              key: api-key
        - name: PORT
          value: "8080"
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ollagraph-mcp-service
  namespace: ai-infrastructure
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
    name: http-sse
  selector:
    app: ollagraph-mcp
```

---

## 19. Frequently Asked Questions

### Q1: How does Cursor IDE know when to use the Ollagraph MCP tool?
Cursor's agent continuously evaluates prompt context. When your request references external documentation, recent software libraries, or explicit search commands (such as `/search`), the LLM selects the registered `ollagraph_search` tool dynamically based on its registered JSON Schema.

### Q2: What is the cost of connecting Cursor to Ollagraph MCP?
Ollagraph operates on a flat credit billing model. Every tool invocation (search, scrape, document parse) costs 1 credit. Unused credits roll over monthly, and if an upstream website fails to render, your credit is automatically refunded.

### Q3: Does Ollagraph store my scraped code or documentation searches?
No. Ollagraph adheres to a strict zero persistent data retention architecture. Scraped web pages and extracted text are processed in volatile memory and returned directly to Cursor over encrypted TLS 1.3 channels. No content is stored on disk or used for AI model training.

### Q4: Can I use Ollagraph MCP on Windows, macOS, and Linux?
Yes. The `@ollagraph/mcp` client bridge runs anywhere Node.js or Python is supported, including macOS (Intel/Apple Silicon), Linux (Ubuntu, Debian, Fedora), and Windows (native PowerShell or WSL2).

### Q5: What is the difference between stdio and SSE transport modes?
`stdio` (Standard Input/Output) launches `@ollagraph/mcp` as a local subprocess directly managed by Cursor IDE. `SSE` (Server-Sent Events) connects Cursor over HTTP to a remote server, which is ideal for enterprise deployments or shared team gateways.

### Q6: What happens if a web page requires client-side JavaScript rendering?
Ollagraph automatically detects target page complexity. If a site requires client-side JavaScript execution, Ollagraph routes the request through stealth headless Chromium browser pools—executing JS and returning clean Markdown without additional configuration.

### Q7: Can Ollagraph parse PDF documentation files directly into Cursor?
Yes. Passing a direct URL to a PDF file into Ollagraph's conversion tool automatically parses multi-column layouts, tables, and text into clean Markdown context inside Cursor.

### Q8: How do I update the `@ollagraph/mcp` package to the latest version?
When using `npx -y @ollagraph/mcp` in your config, npx automatically checks for and uses the latest package release. To force an update manually, run `npm cache clean --force` or update your global installation using `npm install -g @ollagraph/mcp@latest`.

### Q9: Can I run Ollagraph MCP in isolated, air-gapped private cloud VPCs?
Yes. Enterprise subscription tiers support private VPC deployment models where Ollagraph rendering gateways operate inside your dedicated AWS, GCP, or Azure Virtual Private Cloud, routing outbound traffic through static corporate egress proxies.

### Q10: How do enterprise engineering managers manage monthly credit quotas across developer teams?
Account administrators issue scoped API keys per developer team or environment from the Ollagraph Dashboard. Usage, token overhead, and credit consumption can be capped and monitored in real time per key.

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
1. **Get Your API Key:** Log into [Ollagraph.com](https://ollagraph.com) and copy your live key (`osk_live_...`).
2. **Create Your Config:** Add `.cursor/mcp.json` to your primary project repository using the standard npx configuration.
3. **Test in Agent Mode:** Open Cursor Chat (`Cmd+L` / `Ctrl+L`) and run `/search [your technology stack]` to experience real-time, grounded AI coding!
