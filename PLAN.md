# AI Agents for Sales

## Keyword
ai agents for sales

## Problem Statement
Sales leaders evaluating AI tools face a fragmented market: hundreds of vendors claim "AI-powered sales," but only a subset are true autonomous agents (able to act, not just suggest). A VP of Sales needs to quickly shortlist tools that can handle prospecting, outreach sequencing, call coaching, deal forecasting, and pipeline management — all without a week of manual research.

Buyers searching this keyword want a structured comparison they can bring to procurement. They need vendor names, pricing tiers, G2 ratings, and the specific sales tasks each agent handles. The current experience is scrolling through sponsored blog posts with no exportable data.

## What This Actor Does
Scrapes G2, Capterra, and Product Hunt for AI sales agent tools, filtering by category tags ("sales automation," "AI SDR," "sales intelligence"). Returns structured JSON with tool name, vendor, pricing, ratings, integration list, and supported sales tasks (prospecting, outreach, forecasting, coaching).

## Target Users
- Primary: VP of Sales / Sales Operations at mid-market SaaS (100–1000 employees)
- Secondary: Revenue Operations analyst building a vendor comparison matrix
- Use case examples:
  1. Building a board-ready slide comparing top AI sales agents
  2. Evaluating AI SDR vendors before a $50K annual commitment
  3. A consultant preparing recommendations for a client's sales stack

## Input Schema Design
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| maxResults | integer | no | 25 | Max tools to return |
| minRating | number | no | 0 | Minimum rating (0–5) |
| salesTasks | array | no | [] | Filter by task: "prospecting","outreach","coaching","forecasting" |
| pricingModel | string | no | "all" | "free","freemium","paid","enterprise","all" |
| sources | array | no | ["g2","capterra","producthunt"] | Directories to scrape |

## Output Schema Design
```json
{
  "results": [
    {
      "name": "Outreach AI Agent",
      "vendor": "Outreach",
      "description": "AI-driven sales execution platform with autonomous prospecting and sequence management.",
      "sales_tasks": ["prospecting", "outreach", "coaching"],
      "pricing_model": "paid",
      "starting_price_usd": 100,
      "rating": 4.4,
      "review_count": 2150,
      "integrations": ["Salesforce", "HubSpot", "LinkedIn"],
      "source": "g2",
      "url": "https://www.g2.com/products/outreach/reviews",
      "scraped_at": "2026-04-23T15:00:00Z"
    }
  ],
  "metadata": {
    "total_results": 25,
    "run_duration_seconds": 12.1,
    "sources_scraped": ["g2", "capterra"]
  }
}
```

## Technical Approach
- Scraping method: Cheerio (G2 and Capterra category pages)
- Proxy needed: Yes — G2 blocks without residential proxy
- Authentication needed: No
- Rate limiting strategy: 2s delay, proxy rotation
- Estimated run time: 20–30 seconds
- Memory requirement: 256MB

## Build Complexity
LOW — category page scraping with JSON output. No login, no dynamic rendering needed for listing pages.

## Monetization Plan
- Phase 1: Free
- Phase 2: $9/month for scheduled daily refresh + CSV export
- Rationale: Sales tech buyers have budget; "daily refresh" is a strong upsell for teams tracking competitor tool adoption
