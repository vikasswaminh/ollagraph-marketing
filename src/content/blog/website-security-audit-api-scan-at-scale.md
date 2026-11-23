---
title: 'Website Security Audit API: How to Scan Thousands of Websites at Scale'
description: 'Scan thousands of websites for TLS configurations, security headers, subresource integrity, and RFC 9116 security.txt with a unified security audit API.'
metaTitle: 'Website Security Audit API: Scan at Scale'
metaDescription: 'Scan thousands of websites for TLS configurations, security headers, subresource integrity, and RFC 9116 security.txt with a unified security audit API.'
primaryKeyword: 'website security audit api'
secondaryKeywords: 'automated website security audit api, security headers api, check http security headers api, subresource integrity audit, monitor website compliance at scale, scan website for vulnerabilities api, ssl certificate audit api'
pubDate: 2026-09-07
author: 'Amit Sharma'
tags: ['guides', 'seo']
---

## Executive Summary

Auditing the security posture of a single web property is straightforward. An engineer opens browser developer tools, inspects the certificate details in an operating system dialog, verifies headers with a quick command-line probe, and inspects DNS records using standard utilities. But when an enterprise needs to evaluate ten thousand, fifty thousand, or several hundred thousand domains in a single operational window, those conventional manual and single-threaded techniques fail completely.

At scale, web scanning ceases to be a simple script and turns into a complex distributed systems challenge. High-throughput network scanning triggers socket exhaustion on host machines, draws instant IP-level bans from commercial Web Application Firewalls (WAFs), exhausts recursive DNS resolvers, and creates massive compute bottlenecks if teams attempt to orchestrate headless browser fleets.

A dedicated Website Security Audit API (which powers the [Website Security Scorecard API](/blog/website-security-scorecard-api-how-to-quantify-website-risk-at-scale/)) solves this bottleneck by turning complex, multi-vector reconnaissance into structured, predictable programmatic calls. By offloading the probing, cryptographic negotiation, and protocol parsing to an API engine like Ollagraph, engineering teams can run comprehensive audits (integrated into a [full website SEO audit API](/blog/website-seo-audit-how-to-run-a-full-audit-in-one-api-call/)) across transport security, HTTP header hardening, subresource integrity (SRI), cookie hygiene, and vulnerability disclosure mechanisms. This approach delivers deterministic, machine-readable JSON telemetry at enterprise speed without requiring organizations to manage and maintain their own distributed scraping and crawling clusters.

## Key Takeaways

-   **Scale introduces failure modes that single-target scanners never encounter.** Attempting to audit thousands of external websites concurrently will quickly exhaust local ephemeral ports, choke upstream recursive DNS resolvers, and result in immediate IP bans by edge CDNs like Cloudflare, Fastly, and Akamai.
-   **A complete security audit requires multi-layered evaluation.** Assessing web attack surfaces requires examining seven distinct technical areas: Transport Layer Security (TLS cipher suites and certificate chains), HTTP response header hardening, Subresource Integrity (cryptographic validation of external scripts), cookie security flags, domain email authentication (SPF, DKIM, DMARC), DNS security extensions (DNSSEC, CAA), and RFC 9116 vulnerability disclosure compliance.
-   **Isolating protocol probes protects infrastructure throughput.** Running headless Chromium or Playwright instances for thousands of websites is an inefficient use of compute that drains memory. High-scale audits should rely on lightweight, stateless wire-level socket probes for cryptographic and header checks, reserving browser-based DOM rendering strictly for sites that dynamically inject scripts via JavaScript.
-   **Bounded concurrency prevents worker thread starvation.** Production-grade audit systems should fan out per-domain calls through an async client with a concurrency cap and retry with backoff, so a slow or unresponsive target never blocks the queue or holds idle network connections open.
-   **API-first architectures dramatically cut operational maintenance.** Relying on a managed endpoint fabric such as Ollagraph eliminates the overhead of running your own probers, tuning Linux kernel networking parameters, and maintaining a parser for every protocol and header specification.

## 1. Problem Statement: The Engineering Bottlenecks of Scanning at Scale

Whether an organization is evaluating vendor security for Third-Party Risk Management (TPRM), mapping corporate assets in an Attack Surface Management (ASM) program, underwriting cyber insurance portfolios, or enforcing regional data privacy compliance (see our [data privacy audit for AI web scraping](/blog/data-privacy-audit-ai-gdpr-ccpa-web-scraping/)), it faces the reality that scanning tools which work perfectly on one target tend to fail completely across tens of thousands.

When engineering teams attempt to build mass scanning solutions using standard HTTP libraries or scripts wrapped around headless browsers, their infrastructure encounters four fundamental networking and compute bottlenecks:

### Socket Exhaustion and Port Starvation

Every outbound HTTP probe requires a local TCP socket. Standard Linux distributions allocate ephemeral ports within a restricted numeric range, typically between 32,768 and 60,999. When a script initiates thousands of rapid TCP connections, ports are consumed faster than the operating system can release them. As connections close, the sockets enter the `TIME_WAIT` state for one to two minutes to ensure wandering packets are safely discarded. During high-concurrency bursts, the operating system runs out of available outbound ports, causing subsequent connection requests to fail immediately with system-level errors like `EADDRNOTAVAIL` or generic network timeouts.

### WAF Blocking and Fingerprint Detection

Modern websites rarely expose their origin servers directly to the public internet. Instead, they sit behind Content Delivery Networks and Web Application Firewalls such as Cloudflare, Akamai, Imperva, and AWS CloudFront. When an internal scanner launches rapid-fire requests from standard cloud provider IP blocks (such as AWS EC2, GCP, or DigitalOcean), security systems flag the traffic immediately. These defenses analyze TLS Client Hello signatures (JA3 and JA4 fingerprints), TCP window sizes, and HTTP/2 frame parameters. If the signature looks like an automated script rather than a standard consumer browser, the target responds with HTTP 403 Forbidden, HTTP 429 Too Many Requests, or complex JavaScript and CAPTCHA challenges.

### Recursive DNS Resolver Saturation

Auditing 50,000 independent websites requires resolving hostnames across hundreds of thousands of individual DNS queries for A, AAAA, CNAME, MX, and TXT records. Standard recursive resolvers provided by cloud hosting environments or public services (such as 8.8.8.8 or 1.1.1.1) enforce strict per-IP rate limits. Once an audit script crosses these query thresholds, resolvers respond with SERVFAIL or drop packets entirely. The scanner then misinterprets these dropped queries as dead or unregistered domains, polluting the audit dataset with false negatives.

## 2. History: Evolution of Web Security Scanning

Automated web application security auditing has progressed through three main generations over the past twenty-five years.

### Generation 1: The Monolithic Desktop and Command-Line Era (Late 1990s to 2000s)

The earliest tools for assessing website security were built as desktop software or terminal utilities meant to be run manually by human penetration testers. Tools like Nikto, Nessus, OpenVAS, and custom shell scripts combining nmap with curl defined this era.

These tools were designed to perform exhaustive, deep-dive vulnerability scans on one target at a time. They were completely synchronous, heavily stateful, and often took upwards of an hour to complete a single host evaluation. Scaling these utilities across an enterprise inventory of 10,000 domains required complex orchestration: administrators had to manually provision dozens of virtual machines, write brittle bash wrappers to parse raw terminal output, and manage massive XML and text files by hand. Furthermore, because these tools generated high volumes of aggressive traffic, target firewalls routinely blocked their static IPs, making them unsuitable for wide-scale automated monitoring.

### Generation 2: Centralized Cloud Security Suites (2010s)

As cloud architectures matured, security vendors adapted scanning tools into centralized SaaS platforms. Services from vendors like Qualys, Rapid7, and Tenable moved the computational workload from local workstations to managed cloud infrastructure.

These platforms introduced automated scheduling, weekly recurrence engines, and visual risk dashboards aimed at executive teams. However, they were engineered primarily for deep vulnerability assessments rather than high-velocity reconnaissance. Their APIs were often rigid, rate-limited to just a handful of requests per second, and difficult to embed into fast-moving engineering environments. Development teams could not easily use these legacy platforms for lightweight, point-in-time security checks—such as verifying whether 5,000 partner portals had enabled HSTS preloading or adopted the latest TLS standards before an acquisition.

### Generation 3: Composable, API-First Security Intelligence (2020s to Present)

Modern infrastructure engineering requires security testing to run as a continuous, programmatic pipeline integrated directly into software deployment cycles, vendor risk workflows, and real-time monitoring tools.

This generation is characterized by specialized, modular APIs that treat individual protocol verifications as discrete, composable micro-services. Instead of waiting an hour for a bulky, monolithic scan, an engineering pipeline can query individual endpoints dedicated specifically to TLS negotiation, HTTP headers, Subresource Integrity, or email validation. By delegating these protocol checks to platforms like Ollagraph and fanning the calls out concurrently, organizations can evaluate large domain inventories and receive clean, normalized JSON for every check.

## 3. Definition: What is a Website Security Audit API?

A Website Security Audit API is a programmatic service that accepts domain names, hostnames, or URLs as input and performs automated, non-invasive protocol, cryptographic, architectural, and configuration inspections. It returns structured, machine-readable JSON telemetry covering transport security, HTTP defensive headers, subresource integrity, email authentication records, and coordinated vulnerability disclosure standards.

Unlike Dynamic Application Security Testing (DAST) suites that actively attempt to compromise an application by fuzzing inputs, manipulating cookies, or injecting malicious SQL and cross-site scripting strings, a Website Security Audit API operates on the reconnaissance and posture validation layers. It executes deterministic, non-destructive network checks to verify that external services are configured according to industry-standard defense-in-depth principles.

A modern audit API evaluates several distinct security dimensions:

-   **Transport Layer Posture:** Verifies TLS versions, analyzes cipher suite configurations, confirms Perfect Forward Secrecy, checks X.509 certificate chain completeness, and tracks days remaining until certificate expiration.
-   **HTTP Header Hardening:** Examines the presence, syntax, and strength of defensive response headers such as Content Security Policy (CSP), Strict Transport Security (HSTS), X-Frame-Options, X-Content-Type-Options, and Permissions Policy.
-   **Asset Integrity:** Parses the DOM tree to locate external scripts and stylesheets hosted on third-party CDNs, checking whether each resource implements cryptographic Subresource Integrity (SRI) hashes.
-   **Identity and Domain Hygiene:** Audits DNS records to verify DNSSEC validation chains, evaluates Certificate Authority Authorization (CAA) policies, and checks email authentication directives (SPF, DKIM, DMARC, BIMI) to prevent domain spoofing.
-   **Coordinated Disclosure Readiness:** Verifies compliance with RFC 9116 by inspecting `/.well-known/security.txt` for valid security contact points, PGP encryption keys, and future expiration dates.

## 4. Architecture of a High-Throughput Security Audit Pipeline

To scan 50,000 domains quickly and reliably without crashing internal systems or getting blocked, the overall architecture must separate task ingestion, job scheduling, probe execution, and telemetry delivery into independent, loosely coupled layers.

### Client-Side Ingestion and Dispatch

The process begins within the consuming organization's network, where an internal service—such as an automated cron job, an attack surface management tool, or a vendor evaluation system—gathers the list of target domains, normalizes them, and removes duplicates. Instead of opening raw TCP, TLS, and DNS connections to every target itself, the client places the domains on a work queue and lets a small pool of async workers pull from it.

### Per-Check API Calls

Each worker calls one Ollagraph endpoint per security check for its domain, and runs those calls concurrently. Every endpoint is a synchronous `POST` that returns JSON for one target, so there is no job to track or callback to receive:

-   `/v1/intel/ssl` (`{"domain": ...}`) connects on port 443 and returns the leaf certificate's issuer, SANs, expiry date, and `days_remaining`.
-   `/v1/intel/headers` (`{"url": ...}`) follows redirects to the final page and grades its security headers.
-   `/v1/intel/cookies` (`{"url": ...}`) reports `Set-Cookie` flags such as `Secure`, `HttpOnly`, and `SameSite`.
-   `/v1/intel/sri-audit` (`{"url": ...}`) lists external scripts and stylesheets and whether each one carries an `integrity` attribute.
-   `/v1/intel/dnssec`, `/v1/intel/caa`, and `/v1/intel/email-auth` (`{"domain": ...}`) check DNSSEC, CAA policies, and SPF, DKIM, DMARC, and BIMI records.
-   `/v1/intel/security-txt` (`{"url": ...}`) looks for an RFC 9116 `security.txt` file and parses it.

### Client-Side Concurrency Control

The client owns throughput. A semaphore or fixed-size worker pool caps how many calls are in flight, HTTP 429 responses are retried with exponential backoff, and any response whose body has `"status": "error"` is recorded as a failed check rather than as a clean result. Because the probes run from Ollagraph's servers, none of this traffic leaves your own network addresses.

## 5. Internal Working Mechanics: Wire-Level Protocol Inspection

Understanding the telemetry produced by a Website Security Audit API requires an understanding of how these security mechanisms function at the network and protocol layers.

### Transport Layer Security (TLS) and Cipher Suite Negotiation

When a client initiates a secure connection, it begins with the TLS handshake defined in RFC 8446. The scanner transmits a `ClientHello` message over TCP port 443. This message contains the client's supported TLS versions, a list of supported cryptographic cipher suites, supported elliptic curves, and the Server Name Indication (SNI) extension specifying the target domain.

The target server evaluates these options and responds with a `ServerHello` message containing the chosen protocol version and cipher suite, followed immediately by its X.509 certificate chain.

A security audit API interrogates this exchange on several specific points:

-   **Protocol Deprecation:** It confirms that the server rejects legacy, cryptographically broken protocols, specifically SSLv2, SSLv3, TLS 1.0, and TLS 1.1. Production standards require servers to support TLS 1.2 and TLS 1.3 exclusively.
-   **Cipher Suite Hardening:** It verifies that the server negotiates modern ciphers featuring Perfect Forward Secrecy (PFS)—such as `ECDHE-ECDSA-AES128-GCM-SHA256` or `TLS_AES_256_GCM_SHA384`—and avoids outdated, vulnerable cipher constructions like RC4, 3DES, or CBC-mode ciphers prone to padding oracle vulnerabilities.
-   **Certificate Chain Integrity:** It inspects the entire chain of trust, checking that the server presents both the leaf certificate and all required intermediate Certificate Authority (CA) certificates. If an intermediate certificate is missing, the API flags a chain validation error. While desktop browsers may mask this misconfiguration by caching intermediate certificates from prior sessions, mobile applications, APIs, and command-line clients will reject the connection as untrusted.
-   **Certificate Lifetime and Expiration:** The API reads the `valid_to` timestamp from the leaf certificate and compares it against the current system time, reporting the exact number of days remaining until expiration to surface impending service disruptions.

Ollagraph's `/v1/intel/ssl` covers the certificate side of this list: it returns the leaf certificate's issuer, subject, SANs, expiry date, `days_remaining`, and an `is_valid` flag. It does not enumerate supported protocol versions or cipher suites, so pair it with a dedicated TLS scanner such as testssl.sh or sslyze when you need that level of detail.

## 6. Core System Components of an Audit Engine

A production-ready website security audit system comprises five core modular components, each handling a specific stage of the auditing process:

-   **Ingestion Gateway:** Validates inbound batch requests, authenticates API tokens, enforces rate limits, deduplicates URLs, and generates persistent job identifiers.
-   **Egress Router Mesh:** Manages dynamic routing of outbound network requests across a distributed pool of rotating residential and high-reputation datacenter IP addresses.
-   **Protocol Probers:** Lightweight, stateless execution modules that perform raw socket connections for TLS, DNS queries, and streaming HTTP header evaluation.
-   **Scoring Engine:** Compiles raw protocol output, applies compliance rules, and generates normalized ratings, risk grades, and severity indicators.
-   **Webhook Publisher:** Assembles finished audit results into signed JSON payloads and delivers them to the consumer's registered callback endpoint using cryptographic signatures.

## 7. End-to-End Workflow: The Lifecycle of a Batch Audit

Executing a mass security audit across thousands of domains via an API follows a structured sequence. Ollagraph runs each check; your own code handles the fan-out, scoring, and storage:

### Step 1: Build the Target List
The client application compiles the target domains, normalizes them (lowercase, strip paths and trailing dots), removes duplicates, and shuffles the list so that subdomains of the same organization are not scanned back to back.

### Step 2: Fan Out the Checks
A pool of async workers takes domains from the list. For each domain, a worker sends the security checks it needs to their Ollagraph endpoints concurrently, each with a bearer token in the `Authorization` header:

-   `POST /v1/intel/ssl` with `{"domain": "example.com"}` for certificate validity and `days_remaining`.
-   `POST /v1/intel/headers` and `POST /v1/intel/cookies` with `{"url": "https://example.com"}` for the response headers, header grade, and cookie flags of the final page after redirects.
-   `POST /v1/intel/sri-audit` with `{"url": ...}` to list external scripts and stylesheets and their `integrity` attributes.
-   `POST /v1/intel/dnssec`, `/v1/intel/caa`, and `/v1/intel/email-auth` with `{"domain": ...}` for DNSSEC, CAA, and SPF/DKIM/DMARC posture.
-   `POST /v1/intel/security-txt` with `{"url": ...}` to check for an RFC 9116 `security.txt` file.

Each of these calls costs 1 credit, so running five of the checks against 10,000 domains is 50,000 calls and 50,000 credits.

### Step 3: Handle Errors and Retries
A semaphore caps the number of calls in flight. HTTP 429 responses are retried with exponential backoff and jitter. A response whose body carries `"status": "error"` (an unreachable host, a timeout, a non-2xx page) is stored as a failed check, never silently counted as a pass.

### Step 4: Normalize and Score
Once all checks for a domain return, your scoring code combines them: the header grade from `security_grade.grade`, the certificate's `days_remaining`, the count of external assets without SRI (`external_without_sri`), and whether `security.txt` meets the RFC 9116 minimum (`rfc9116_minimum_compliant`). Map each finding to a severity (such as Low, Medium, High, or Critical) according to your own policy.

### Step 5: Persist and Act
The system writes the normalized findings to its database, keyed by domain and scan run, and routes any critical alerts—such as an SSL certificate expiring within 7 days—to internal communication tools like Slack or PagerDuty.

## 8. Production Configuration Reference: Ollagraph Security Endpoints

Ollagraph provides dedicated, purpose-built endpoints for web intelligence, security auditing, and reconnaissance. All endpoints are hosted at the base URL `https://api.ollagraph.com` and authenticate via an API bearer token in the `Authorization` header.

### 1. HTTP Security Headers Audit (/v1/intel/headers)

This endpoint follows redirects to the final page, returns its HTTP response headers, lists which defensive headers are present or missing, and calculates a 0–100 security-header score with a grade from A down to F.

#### Request Example (cURL)

```bash
curl -X POST "https://api.ollagraph.com/v1/intel/headers" \
  -H "Authorization: Bearer osk_live_production_token" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

#### Response Structure (JSON)

```json
{
  "status": "success",
  "url": "https://example.com",
  "final_status": 200,
  "elapsed_ms": 212,
  "headers": [
    ["server", "cloudflare"],
    ["strict-transport-security", "max-age=31536000; includeSubDomains"],
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "SAMEORIGIN"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["cross-origin-opener-policy", "same-origin"]
  ],
  "header_count": 18,
  "security_grade": {
    "score": 60,
    "grade": "C",
    "present": [
      {"header": "strict-transport-security", "value": "max-age=31536000; includeSubDomains", "points": 25},
      {"header": "x-content-type-options", "value": "nosniff", "points": 10},
      {"header": "x-frame-options", "value": "SAMEORIGIN", "points": 10},
      {"header": "referrer-policy", "value": "strict-origin-when-cross-origin", "points": 10},
      {"header": "cross-origin-opener-policy", "value": "same-origin", "points": 5}
    ],
    "missing": [
      {"header": "content-security-policy", "points": 25, "note": "CSP — restricts what the page can load"},
      {"header": "permissions-policy", "points": 10, "note": "Permissions-Policy — disables sensors/APIs the site doesn't use"},
      {"header": "cross-origin-resource-policy", "points": 5, "note": "CORP — restricts cross-origin loads"}
    ]
  }
}
```

The response is truncated to the security-relevant headers here; the real `headers` array lists every response header as `[name, value]` pairs.

## 9. Real-World Code Examples: Building the Concurrent Scanner

Both examples below use the same pattern: one Ollagraph call per check, fanned out concurrently from your own client with a cap on how many calls are in flight.

### 1. Python: Concurrent Async Scanner

This pattern uses `asyncio` and `httpx` with an internal semaphore to audit hundreds of domains in parallel without exceeding client socket or rate limits:

```python
import asyncio
import httpx

API_BASE = "https://api.ollagraph.com"
HEADERS = {"Authorization": "Bearer osk_live_token"}
SEMAPHORE = asyncio.Semaphore(50)  # Controls max parallel workers

async def scan_domain(client: httpx.AsyncClient, domain: str):
    async with SEMAPHORE:
        # Run header and SSL probes concurrently for each target
        h_req = client.post(f"{API_BASE}/v1/intel/headers", json={"url": f"https://{domain}"})
        s_req = client.post(f"{API_BASE}/v1/intel/ssl", json={"domain": domain})
        h_res, s_res = await asyncio.gather(h_req, s_req, return_exceptions=True)
        
        return {
            "domain": domain,
            "header_grade": h_res.json().get("security_grade", {}).get("grade") if not isinstance(h_res, Exception) else "ERROR",
            "cert_days_left": s_res.json().get("days_remaining") if not isinstance(s_res, Exception) else -1
        }

async def main(domains):
    limits = httpx.Limits(max_keepalive_connections=50, max_connections=100)
    async with httpx.AsyncClient(headers=HEADERS, limits=limits, timeout=15.0) as client:
        results = await asyncio.gather(*(scan_domain(client, d) for d in domains))
        for r in results:
            print(f"{r['domain']} -> Headers: {r['header_grade']} | Cert Days: {r['cert_days_left']}")

if __name__ == "__main__":
    asyncio.run(main(["github.com", "stripe.com", "cloudflare.com"]))
```

### 2. TypeScript / Node.js: SRI and security.txt Worker Pool

This Node.js 18+ example uses the built-in `fetch` and a fixed-size worker pool to check Subresource Integrity coverage and RFC 9116 `security.txt` compliance across a domain list:

```typescript
const API_BASE = 'https://api.ollagraph.com';
const HEADERS = {
  Authorization: `Bearer ${process.env.OLLAGRAPH_API_KEY}`,
  'Content-Type': 'application/json',
};

async function call(path: string, body: Record<string, string>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  return res.json();
}

async function auditDomain(domain: string) {
  const url = `https://${domain}`;
  // Run both checks for this domain concurrently
  const [sri, securityTxt] = await Promise.all([
    call('/v1/intel/sri-audit', { url }),
    call('/v1/intel/security-txt', { url }),
  ]);
  return {
    domain,
    unpinnedAssets: sri.external_without_sri ?? null, // null when the SRI check errored
    securityTxtCompliant: securityTxt.rfc9116_minimum_compliant ?? false,
    securityTxtExpires: securityTxt.expires ?? null,
  };
}

// Fixed-size worker pool: at most `limit` domains in flight at once
async function auditAll(domains: string[], limit = 25) {
  const results: Awaited<ReturnType<typeof auditDomain>>[] = [];
  const queue = [...domains];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length > 0) {
      const domain = queue.shift()!;
      try {
        results.push(await auditDomain(domain));
      } catch (err) {
        console.error(`${domain}: ${err}`);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

auditAll(['github.com', 'stripe.com', 'cloudflare.com']).then((rows) => {
  for (const r of rows) {
    const expired = r.securityTxtExpires !== null && new Date(r.securityTxtExpires) < new Date();
    console.log(
      `${r.domain} -> unpinned external assets: ${r.unpinnedAssets} | ` +
        `security.txt compliant: ${r.securityTxtCompliant}${expired ? ' (EXPIRED)' : ''}`
    );
  }
});
```

`/v1/intel/security-txt` returns the `Expires` value as written in the file, so the expiry comparison happens in your code.

## 10. How to Benchmark Self-Hosted vs. API-Based Scanning

To compare running your own scanning cluster with calling a managed API, run both against the same sample of your own domains (a few hundred to a few thousand is enough to expose bottlenecks) and evaluate each domain across the same checks, for example TLS certificate validity, HTTP response headers, Subresource Integrity, DNSSEC, and RFC 9116 `security.txt` discovery. Then measure:

#### Total Execution Time
Record wall-clock time from the first request to the last stored result for each approach, at the same client-side concurrency cap.

#### Infrastructure Provisioned
Note the instance types, vCPUs, and memory each approach needed to finish without errors. For the API approach this is just the dispatcher that fans out the calls.

#### DNS Resolution Reliability
Count lookups that returned SERVFAIL or timed out, and re-check a sample of them by hand to separate resolver throttling from domains that are genuinely dead.

#### Blocking and Error Rates
Count HTTP 403 and 429 responses, CAPTCHA pages, and errored checks per approach. For the API, count responses whose body has `"status": "error"`, and include them in the comparison rather than dropping them.

#### Cost per Domain
Add up compute, bandwidth, and engineering time for the self-hosted run, and credits consumed for the API run (1 credit per check per domain), then divide by the number of domains audited.

## 11. Operational Security and Safe Egress Etiquette

Conducting security evaluations across thousands of external websites comes with technical and operational responsibilities. Poorly configured scanners can inadvertently trigger security alerts, cause resource spikes on small target servers, or run afoul of acceptable use policies.

### Responsible Scanning Principles

-   **Maintain Non-Invasive Boundaries:** Scanners should only perform passive, non-destructive evaluations. Restrict probes to standard TCP handshakes, TLS negotiations, DNS lookups, and basic HTTP GET or HEAD requests. Never inject fuzzing strings, test SQL injection sequences, or attempt credential verification during an audit scan.
-   **Use Clear User-Agent Attribution:** Transparently identify your organization in the request headers. Include an email address or an informational URL where site administrators can reach your team if they have questions. A standard format is: `EnterpriseComplianceAudit/2.0 (+https://example.com/audit-info; contact: secops@example.com)`.
-   **Respect Rate Limits and Backoff Directives:** If a target web server returns an HTTP 429 Too Many Requests or an HTTP 503 Service Unavailable with a `Retry-After` header, the scanning engine must pause requests to that specific host for the requested duration.
-   **Randomize Target Distribution:** When auditing an extensive domain list, avoid querying subdomains of the same parent organization consecutively. Shuffle your domain queue to distribute outbound requests across different Autonomous System Numbers (ASNs), preventing traffic spikes on individual hosting providers.

## 12. Operational Troubleshooting Guide

When conducting large-scale web security audits, network anomalies and edge cases are common. The following diagnostic breakdowns cover the most frequent operational challenges:

### Repeated TLS Handshake Timeouts
-   **Symptom:** Connection attempts to port 443 fail with `ETIMEDOUT` errors across multiple targets.
-   **Root Cause:** The origin server requires Server Name Indication (SNI) and refuses connections when the extension is missing, or the server drops connections that do not offer modern cipher suites.
-   **Resolution:** Ensure that the SNI extension is explicitly included in the ClientHello packet, and verify that the probing client negotiates both TLS 1.2 and TLS 1.3 ciphers.

### HTTP 403 Forbidden on Static Header Requests
-   **Symptom:** Standard HTTP requests return 403 Forbidden responses on targets fronted by Cloudflare or Akamai.
-   **Root Cause:** The target WAF detected an automated client TLS fingerprint, flagging a mismatch in JA3/JA4 signatures or HTTP/2 frame settings.
-   **Resolution:** Record the target as blocked rather than as failing the check, and retry it later at a lower rate. Running the probe through an API such as Ollagraph keeps the request off your corporate IP ranges, but a strict WAF can still challenge it.

### Negative Days Until Certificate Expiration
-   **Symptom:** The audit telemetry reports a negative value for `days_remaining`.
-   **Root Cause:** The target server is actively serving an expired SSL certificate that was not renewed before its `valid_to` date.
-   **Resolution:** Check whether the certificate is on an active production endpoint or an abandoned fallback hostname. Flag the target immediately as a Critical vulnerability in your reporting system.

### Missing Subresource Integrity Hashes on Dynamic Scripts
-   **Symptom:** Third-party JavaScript files are loaded on the page, but static SRI checks report zero external resources.
-   **Root Cause:** The target application uses a client-side JavaScript module loader (such as Webpack chunking or dynamic imports) that injects script tags into the DOM at runtime.
-   **Resolution:** Combine static SRI parsing with Ollagraph's `/v1/scrape` endpoint to capture a fully rendered DOM snapshot after client-side scripts execute.

## 13. Architectural Best Practices

### Separate Static Protocol Probing from Full DOM Rendering
Never deploy headless browsers to verify simple HTTP security headers, TLS ciphers, or DNS records. Browser automation should be reserved exclusively for dynamic Single-Page Applications where client-side JavaScript injects third-party tracking tags or external dependencies at runtime.

### Implement Two-Tiered Caching for Infrastructure Attributes
Cryptographic certificates, DNSSEC signatures, and CAA records change infrequently. Implement an internal caching tier that stores these results for 12 to 24 hours based on the domain name hash (`sha256` of the domain). Continue to evaluate HTTP security headers dynamically, but avoid running redundant cryptographic handshakes on unchanged infrastructure to optimize API credit usage.

### Enforce Idempotency When Writing Results
Retried calls and re-queued domains can produce the same result more than once in a single scan run. Ensure your ingestion pipeline uses database idempotency keys:

```sql
INSERT INTO domain_security_audits (domain, scan_run_id, header_grade, cert_days_remaining, audited_at)
VALUES ('example.com', 'run_2026_09_07', 'B', 74, '2026-09-07T10:30:00Z')
ON CONFLICT (domain, scan_run_id) DO NOTHING;
```

### Apply Exponential Backoff with Jitter for Rate Governance
When querying APIs concurrently, handle any HTTP 429 rate-limit responses using exponential backoff with full jitter to avoid causing thundering herd problems across your worker threads:

```
Sleep Time = Random(0, Minimum(Max_Wait, Base_Wait * (2 ^ Attempt_Count)))
```

## 14. Common Engineering Anti-Patterns

### Assuming HTTP 200 Proves Secure Transport
A target returning an HTTP 200 OK status simply confirms that an HTTP server is accepting connections. It does not verify whether transport encryption is active. A site can easily serve an HTTP 200 status over unencrypted plain text or over deprecated TLS 1.0 protocols using weak ciphers. Liveness monitoring and security auditing are distinct operational tasks.

### Scanning from Static Cloud Datacenter Ranges
Launching high-volume security scans from standard cloud hosting subnets (such as AWS EC2 or DigitalOcean) is an anti-pattern. WAF providers maintain public lists of these datacenter IP ranges and frequently apply aggressive challenge rules to them, leading to high rates of false-positive 403 blocks.

### Ignoring Intermediate Redirect Hops
Evaluating security headers only on the initial target URL (`http://example.com`) without following redirects through to the final canonical destination (`https://www.example.com/`) produces inaccurate data. If an intermediate hop fails to set HSTS or strips CSP headers, the scanner will record incorrect telemetry. High-scale audit engines must follow redirects to their canonical endpoints.

### Storing Raw, Unstructured HTML Payloads
Downloading and saving multi-megabyte HTML documents across 50,000 domains quickly consumes terabytes of database storage without providing additional security value. Instead, parse and extract relevant security structures at the collection edge—capturing only the lists of external scripts, SRI hashes, and response headers.

## 15. Alternatives and Architectural Trade-offs

When designing an enterprise-scale website security audit pipeline, engineering teams generally choose between three approaches:

### Approach 1: Custom Self-Hosted Scraper Built In-House
-   **Primary Advantage:** Provides total low-level control over socket parameters, custom protocol hooks, and internal probe logic.
-   **Primary Engineering Trade-offs:** Requires significant engineering maintenance to manage proxy rotations, solve IP blocking, tune Linux kernel networking parameters, and patch headless browser crashes. Infrastructure and proxy bandwidth costs escalate rapidly at high volumes.

### Approach 2: Monolithic Enterprise Vulnerability Suites
-   **Primary Advantage:** Delivers ready-made executive dashboards, PDF reports for compliance auditors, and broad vulnerability scanning templates.
-   **Primary Engineering Trade-offs:** Prohibitively expensive for high-volume scanning, features rigid and heavily rate-limited APIs, and cannot be easily embedded into high-velocity developer workflows or custom SaaS applications.

### Approach 3: API-First Managed Audit Engine
-   **Primary Advantage:** Offers zero probe infrastructure to maintain, one endpoint per security check, and structured JSON responses that a small client can fan out concurrently.
-   **Primary Engineering Trade-offs:** Requires your own concurrency and retry logic, plus an internal data pipeline to store, visualize, and act upon the results.

### Evaluation Summary
Building an in-house scanner makes sense only for organizations with dedicated network engineering teams prepared to manage proxies and kernel settings full-time. Monolithic suites are best suited for traditional compliance teams needing static reports. An API-first engine like Ollagraph is the most practical choice for engineering-focused teams building custom dashboards, attack surface management platforms, or automated vendor review pipelines that need fast, reliable telemetry.

## 16. Feature and Architecture Comparison Analysis

| Feature / Dimension | Self-Hosted Scrapers | Legacy Enterprise Suites | Ollagraph API Engine |
| :--- | :--- | :--- | :--- |
| **Max Concurrent Domain Scans** | 500–1,000 per machine (socket limits) | 10–50 (strict vendor API throttling) | Set by your client's concurrency cap, within your plan's rate limit |
| **Edge WAF Stealth & Proxy Mesh** | Manual proxy list maintenance, high ban rate | Lacks stealth, requires IP allowlisting | Probes run from Ollagraph's servers, not your corporate IPs |
| **HTTP Security Header Grading** | Custom regex parsers per header spec | Bundled inside slow monolithic scans | Dedicated endpoint (`/v1/intel/headers`) with A to F grades |
| **Subresource Integrity (SRI)** | Requires heavy DOM parsers / browsers | Often omitted or basic inventory only | Native endpoint (`/v1/intel/sri-audit`) reporting which external assets carry `integrity` |
| **RFC 9116 security.txt Discovery** | Custom scripts to fetch and parse | Rarely supported or minor informational | Dedicated endpoint (`/v1/intel/security-txt`) with parsed fields and an RFC 9116 minimum-compliance flag |

## 17. Enterprise On-Premises and Hybrid Deployment Blueprint

Organizations operating in strictly regulated industries—such as banking, healthcare, or defense—often need to audit both internal private network services and external public web assets. A hybrid deployment model addresses this by separating internal and external audit traffic.

In this model, the organization maintains an internal corporate asset database containing both private intranet domains and public web applications. An internal dispatch filter classifies each target:

-   **Private Network Routing:** Targets matching internal naming schemes (such as `*.corp.internal` or private RFC 1918 IP spaces) are directed to containerized Go-based probe workers running inside the local private subnet. These internal workers assess local services without routing traffic over the public internet.
-   **Public Network Routing:** Public-facing domains are dispatched directly to Ollagraph's cloud API. This offloads public egress traffic from corporate firewalls, preventing corporate gateway IPs from being blacklisted by external WAFs.
-   **Unified Data Ingestion:** Telemetry from both the internal probe pods and the external Ollagraph API responses is normalized into a shared JSON schema and stored in a central data repository (such as Splunk, Snowflake, or Datadog). This provides security teams with a single pane of glass for their entire internal and external attack surface.

## 18. Cloud-Native Event-Driven Scanning Architecture

For organizations running on modern cloud infrastructure (such as AWS), integrating the Ollagraph Security Audit API into an event-driven architecture ensures scans run reliably with minimal idle infrastructure costs.

The architecture operates in a five-step automated flow:

1.  **Scheduled Triggers:** Amazon EventBridge initiates an audit run on a regular schedule (such as daily or weekly) by sending an event to an Ingestion Lambda function.
2.  **Queue Fan-Out:** The Ingestion Lambda pulls the list of target domains from an Amazon DynamoDB inventory table and sends one message per domain to an Amazon SQS queue.
3.  **Scanner Execution:** A Scanner Lambda consumes the queue. Its reserved concurrency and SQS batch size cap how many domains are scanned at once. For each domain it calls the Ollagraph checks concurrently: `/v1/intel/ssl`, `/v1/intel/headers`, `/v1/intel/sri-audit`, and `/v1/intel/security-txt`. Failed messages return to the queue and retry, with a dead-letter queue catching repeat failures.
4.  **Scoring:** The Scanner Lambda turns the responses into findings: header grade, certificate `days_remaining`, unpinned external assets, and `security.txt` compliance.
5.  **Data Persistence and Escalation:** The Scanner Lambda writes the audit results into Amazon DynamoDB, keyed by domain and scan run. If any critical issues are detected—such as a production certificate expiring within 7 days—the Lambda publishes an alert to an Amazon SNS topic, notifying the security team via Slack or PagerDuty.

## 19. Frequently Asked Questions (FAQs)

### 1. Does running a website security audit via an API trigger intrusion detection alarms on target systems?
No. Non-invasive security audit APIs like Ollagraph perform reconnaissance-level protocol evaluations: standard TCP handshakes, TLS negotiations, HTTP GET/HEAD requests, and standard DNS queries. They do not inject exploit payloads, run SQL injection tests, fuzz web inputs, or attempt authentication brute-forcing. To intrusion detection systems (such as Snort, Suricata, or AWS GuardDuty), these audit requests appear as normal, well-behaved client traffic.

### 2. How does Ollagraph handle websites protected by advanced anti-bot systems like Cloudflare or Akamai?
Standard scraping scripts fail against anti-bot defenses because their TLS client signatures (JA3/JA4 fingerprints) and HTTP/2 connection parameters do not match standard consumer browsers. Ollagraph's security checks are single, low-volume requests, one per check, sent from Ollagraph's servers. A strict WAF can still challenge them, and when it does the endpoint reports what it received (for example, a 403 `final_status` from `/v1/intel/headers`), so record that target as blocked rather than as failing the check. For page content that depends on JavaScript, `/v1/scrape/smart` tries a fast HTTP fetch first and falls back to a headless browser when the page needs it.

### 3. What is the fundamental difference between a DAST scanner and a Website Security Audit API?
A Dynamic Application Security Testing (DAST) scanner actively tests web applications for exploitable vulnerabilities by submitting forms, fuzzing URL parameters, injecting scripts, and evaluating server error messages. A Website Security Audit API focuses instead on infrastructure, protocol, and configuration posture: verifying transport security (TLS), HTTP security headers, subresource integrity (SRI), email records (SPF/DMARC), and DNS security (DNSSEC). Audit APIs are non-destructive, significantly faster, and safe to run across large inventories of third-party domains.

### 4. Why should an organization use an API rather than running tools like Nikto, OpenVAS, or OWASP ZAP locally?
Tools like Nikto and OWASP ZAP are built for deep, single-target assessments. Running them across 10,000 websites requires managing extensive compute infrastructure, writing custom multi-threading code, and continually rotating proxy IPs to prevent bans. These legacy tools also take minutes to hours per target. Ollagraph's specialized endpoints each evaluate one protocol vector per request and return clean, structured JSON, which a small concurrent client can fan out across thousands of domains without local probe infrastructure.

### 5. Can Ollagraph identify impending SSL/TLS certificate expirations across a large domain portfolio?
Yes. The `/v1/intel/ssl` endpoint performs a direct cryptographic handshake with target domains, extracts the X.509 leaf certificate, and calculates the remaining validity window in days (`valid_to` minus current time). By scanning domain catalogs periodically, organizations can set custom alerts that trigger whenever `days_remaining` drops below operational thresholds (such as 30, 14, or 7 days), helping teams resolve certificate renewal failures before they lead to public service outages.

### 6. Why is Subresource Integrity (SRI) important for enterprise compliance, and how does the API check it?
Subresource Integrity ensures that third-party scripts loaded from external Content Delivery Networks have not been altered or compromised by attackers (mitigating supply-chain threats like Magecart). The Ollagraph `/v1/intel/sri-audit` endpoint parses the target page's HTML structure, identifies all externally hosted script and stylesheet elements, reports whether each carries an integrity attribute (with an overall `sri_coverage_pct`), and returns the attribute value so your code can check which hash function it uses (SRI allows SHA-256, SHA-384, or SHA-512).

### 7. How does the API handle HTTP-to-HTTPS redirect chains during security audits?
Many websites initially answer connection requests on unencrypted HTTP (port 80) before redirecting users to secure HTTPS (port 443), sometimes passing through intermediate subdomains or load balancers. Ollagraph's `/v1/intel/headers` endpoint automatically follows redirect chains to their final destination and grades the headers that page returns. To inspect each hop on the way, call `/v1/intel/redirects`, which returns the status and `Location` of every hop.

### 8. What is RFC 9116 security.txt, and why is it included in web security audits?
RFC 9116 defines a standard location (`/.well-known/security.txt`) where organizations publish their vulnerability disclosure policies, security contact emails, and public encryption keys. Security frameworks and vulnerability disclosure programs look for this file to ensure researchers have a clear path to report findings responsibly. Ollagraph's `/v1/intel/security-txt` endpoint checks `/.well-known/security.txt` and then `/security.txt`, parses the fields, returns the `Contact` and `Expires` values, and sets `rfc9116_minimum_compliant` when both are present. Compare `expires` with today's date in your own code to catch a stale file.

## 20. References and Standards

-   **RFC 8446:** The Transport Layer Security (TLS) Protocol Version 1.3. Internet Engineering Task Force (IETF). https://datatracker.ietf.org/doc/html/rfc8446
-   **RFC 6797:** HTTP Strict Transport Security (HSTS). Internet Engineering Task Force (IETF). https://datatracker.ietf.org/doc/html/rfc6797
-   **RFC 9116:** A File Format to Aid in Security Vulnerability Disclosure (security.txt). Internet Engineering Task Force (IETF). https://datatracker.ietf.org/doc/html/rfc9116
-   **W3C Working Draft:** Content Security Policy Level 3. World Wide Web Consortium (W3C). https://www.w3.org/TR/CSP3/
-   **W3C Recommendation:** Subresource Integrity (SRI). World Wide Web Consortium (W3C). https://www.w3.org/TR/SRI/
-   **RFC 7231:** Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content. Internet Engineering Task Force (IETF). https://datatracker.ietf.org/doc/html/rfc7231
-   **Ollagraph Official Documentation:** API Endpoints, Authentication, and Intelligence Services Reference. https://ollagraph.com/docs/

## 21. Conclusion

Scanning web application security across thousands of domains is fundamentally a distributed systems challenge. Engineering teams that attempt to build internal mass-scanning scrapers inevitably spend more time troubleshooting Linux kernel socket states, managing proxy pools, and resolving WAF blocks than analyzing actual security data.

Using an API-first approach transforms mass web reconnaissance into predictable, structured programmatic calls. Whether an organization is managing third-party vendor risk across a large partner network, auditing corporate domain portfolios to prevent certificate expirations, or building automated risk models for cyber insurance underwriting, Ollagraph's security intelligence endpoints provide one structured check per call, so a small concurrent client can audit thousands of websites without running its own probe fleet.

To start auditing your web properties programmatically, create an account and obtain an API key at https://ollagraph.com, and review the complete endpoint specifications in the interactive documentation at https://ollagraph.com/docs/.
