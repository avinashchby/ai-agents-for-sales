## ⚠️ RESEARCH UPDATE — v2 (April 2026)

### Source Status Update
**Removed (blocked or acquired):**
  - G2 (Cloudflare)
  - Capterra (acquired by G2)
  - GetApp (acquired by G2)

**G2 Ecosystem Note:** G2 acquired Capterra, Software Advice, and GetApp in January 2026.
All four properties now share the same Cloudflare/anti-bot infrastructure. None are viable
as primary scraping sources.

### Replacement Sources Selected
  - Futurepedia (sales category) — confirmed working (static HTML, no Cloudflare)
  - TopAI.tools — confirmed working (static HTML, no Cloudflare)
  - Toolify.ai — confirmed working (static HTML, no Cloudflare)

These were selected based on RESEARCH_PHASE0.md live research (April 2026):
- Futurepedia, TopAI.tools, Toolify.ai: AI-specific directories, CheerioCrawler-ready, no Cloudflare
- TrustRadius: B2B software reviews, static HTML, accepts datacenter IPs
- SourceForge: 40,000+ software products, open HTML

### Product Hunt Extraction Note
If this actor uses Product Hunt as a source: data MUST be extracted from window.__NEXT_DATA__
(Apollo GraphQL cache embedded in Next.js SSR output), NOT CSS selectors. CSS selectors on
Product Hunt break on every frontend deploy because React CSS modules generate random class names.
Residential proxy is required — datacenter IPs are blocked by Cloudflare.
URL pattern: https://www.producthunt.com/topics/sales

### Dual-Mode Rationale
compare-tools mode: Serves users evaluating which AI tools exist in this category.
Feeds the RemoteLama comparison table on remotelama.com/ai-agents/ai-agents-for-sales.

extract-data mode: Serves developers building AI agents who need structured data
as input to their pipelines.


---

# Market & Competitor Research: AI Agents for Sales

## Search Demand Analysis
- Primary keyword: ai agents for sales
- Related keywords:
  - ai sales tools
  - ai sdr software
  - ai sales automation
  - artificial intelligence for sales teams
  - best ai sales agents 2025
  - ai sales assistant
  - autonomous sales agents
- User intent: Commercial — tool evaluation and procurement
- Who is searching: Sales VPs, RevOps managers, sales enablement leads at B2B companies

## Existing Solutions (Competitors)

### Direct competitors on Apify Store
| Actor Name | Developer | Users | Rating | Price | Gap/Weakness |
|------------|-----------|-------|--------|-------|--------------|
| G2 Scraper (generic) | apify | 800+ | 4.2 | $15/mo | No AI/sales filter |
| SalesNav Scraper | various | 300+ | 3.5 | Paid | LinkedIn only, not a tool directory |

### Broader market alternatives
| Tool | Price | Weakness vs our actor |
|------|-------|----------------------|
| G2 manual search | Free | No API, no bulk export, no automation |
| Gartner Peer Insights | Free | Paywalled detailed data |
| Forrester Wave reports | $2000+ | Expensive, infrequent updates |

## Differentiation Strategy
This actor targets the "sales AI tools" research workflow specifically. Unlike generic G2 scrapers, it pre-filters for AI agent tools and enriches results with sales-task tags (prospecting vs coaching vs forecasting) — enabling immediate decision-making.

## SEO Strategy for Apify Listing

### Title (max 60 chars):
AI Sales Agent Finder — G2, Capterra & ProductHunt

### Description (max 200 chars):
Find and compare AI sales agents. Scrapes G2, Capterra, Product Hunt. Returns pricing, ratings, integrations, and sales task coverage in structured JSON.

### Tags:
sales, ai-tools, lead-generation, automation, b2b

### README keywords to include naturally:
ai agents for sales, ai sales tools comparison, best ai sdr software, ai sales automation platforms, autonomous sales agents, ai sales assistant, sales ai tool directory

## GEO Notes
Key phrases: "structured list of AI sales agents," "filter by sales task," "G2 ratings for sales AI tools"
Include API usage example showing how to call this from a LangGraph node or n8n workflow.

## Verdict
YES — high commercial intent, second-highest priority after lead generation. Sales tech is the largest AI agent spend category.
