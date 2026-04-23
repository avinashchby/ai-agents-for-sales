# AI Agents for Sales — Finder & Comparator

Finding the right AI sales tools is time-consuming when you're evaluating dozens of platforms across multiple directories. This Apify actor scrapes G2, Capterra, and Product Hunt to surface the best AI agents for sales — filtering by task coverage, CRM integration, rating, and pricing — and returns a clean, deduplicated JSON dataset ready for analysis or import.

Built for Sales VPs, RevOps managers, and sales enablement leads who need reliable data on the autonomous sales agents market without manual research.

---

## What it does

- Scrapes G2 (`/categories/sales-intelligence`), Capterra (`/sales-force-automation-software/`), and Product Hunt (`/search?q=ai+sales+agent`) for AI-powered sales tools
- Filters results by sales task coverage (prospecting, outreach, coaching, forecasting, pipeline management)
- Filters by CRM integrations (Salesforce, HubSpot, Pipedrive, Salesloft, Outreach)
- Filters by minimum rating and pricing model
- Infers sales task coverage and pricing model from product descriptions when not explicitly listed
- Deduplicates across sources by name and vendor
- Returns structured JSON with pricing, ratings, review counts, integrations, and source attribution
- Exports both individual dataset items and a summary `OUTPUT` key with run metadata

---

## Input

| Field | Type | Default | Description |
|---|---|---|---|
| `maxResults` | integer | `50` | Maximum number of tools returned across all sources. Range: 1–200. |
| `salesTasks` | array | `[]` | Filter to tools covering at least one task: `prospecting`, `outreach`, `coaching`, `forecasting`, `pipeline-management`. Empty = no filter. |
| `crmIntegrations` | array | `[]` | Filter to tools that integrate with: `salesforce`, `hubspot`, `pipedrive`, `salesloft`, `outreach`. Empty = no filter. |
| `minRating` | number | `0` | Minimum average rating (0–5). Tools with no rating are excluded when this is above 0. |
| `pricingModel` | string | `"all"` | One of: `free`, `freemium`, `paid`, `enterprise`, `all`. |
| `sources` | array | `["g2","capterra","producthunt"]` | Which directories to scrape. Remove any to skip it. |

---

## Output

Each result in the dataset has the following shape:

```json
{
  "name": "Apollo.io",
  "vendor": "Apollo",
  "description": "AI-powered sales intelligence and engagement platform for prospecting, outreach sequences, and pipeline management.",
  "sales_tasks": ["prospecting", "outreach"],
  "crm_integrations": ["salesforce", "hubspot", "pipedrive"],
  "pricing_model": "freemium",
  "starting_price_usd": 49,
  "rating": 4.5,
  "review_count": 7210,
  "source": "g2",
  "url": "https://www.g2.com/products/apollo-io/reviews",
  "scraped_at": "2026-04-23T18:00:00.000Z"
}
```

The `OUTPUT` key-value store entry also includes a metadata object:

```json
{
  "metadata": {
    "total_results": 47,
    "run_duration_seconds": 12.4,
    "sources_scraped": ["g2", "capterra", "producthunt"]
  }
}
```

---

## Example use cases

- **RFP shortlisting** — Pull all AI SDR software with a freemium tier rated above 4.0 on G2 or Capterra before issuing an RFP to vendors.
- **Sales coaching tool audit** — Filter for `salesTasks: ["coaching"]` across all sources to build a comparison sheet of AI sales assistant platforms with pricing before a budget cycle.
- **Competitive market mapping** — Run weekly with `sources: ["producthunt"]` to track newly launched autonomous sales agents and feed them into your competitive intelligence workflow.

---

## How to run

**Via the Apify API:**

```bash
curl -X POST \
  "https://api.apify.com/v2/acts/avinashchby~ai-agents-for-sales/runs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "maxResults": 50,
    "salesTasks": ["prospecting", "outreach"],
    "minRating": 4.0,
    "pricingModel": "freemium",
    "sources": ["g2", "capterra"]
  }'
```

**Via Apify Console:**

Open the actor on [Apify Store](https://apify.com/avinashchby/ai-agents-for-sales), fill in the input form, and click **Start**. Results appear in the **Dataset** tab when the run completes.

---

## About

This actor is part of a collection of AI tool directory scrapers built for sales and RevOps teams. It is designed to be cost-efficient (residential proxy, rate-limited to 30 req/min, 2-source concurrency) and to return only the fields relevant to sales ai tool directory use cases — no raw HTML, no bloat. Feedback and issues welcome via GitHub.
