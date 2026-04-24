import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';

interface ToolResult {
  name: string;
  vendor: string;
  description: string;
  pricing_model: string;
  rating: number | null;
  source: string;
  url: string;
  scraped_at: string;
}

type VendorBase = Omit<ToolResult, 'scraped_at'>;

const FALLBACK_VENDORS: VendorBase[] = [
  {
    "name": "Gong",
    "vendor": "Gong",
    "description": "AI-powered conversation intelligence and sales coaching",
    "pricing_model": "paid",
    "url": "https://www.gong.io",
    "rating": null,
    "source": "fallback"
  },
  {
    "name": "Outreach",
    "vendor": "Outreach",
    "description": "Sales engagement platform with AI-driven outreach sequences",
    "pricing_model": "paid",
    "url": "https://www.outreach.io",
    "rating": null,
    "source": "fallback"
  },
  {
    "name": "Salesloft",
    "vendor": "Salesloft",
    "description": "AI sales engagement and pipeline management platform",
    "pricing_model": "paid",
    "url": "https://www.salesloft.com",
    "rating": null,
    "source": "fallback"
  },
  {
    "name": "Clari",
    "vendor": "Clari",
    "description": "AI revenue platform for sales forecasting and pipeline inspection",
    "pricing_model": "paid",
    "url": "https://www.clari.com",
    "rating": null,
    "source": "fallback"
  },
  {
    "name": "Apollo.io",
    "vendor": "Apollo.io",
    "description": "AI prospecting and sales intelligence with 270M+ contacts",
    "pricing_model": "freemium",
    "url": "https://www.apollo.io",
    "rating": null,
    "source": "fallback"
  },
  {
    "name": "Lavender",
    "vendor": "Lavender",
    "description": "AI email assistant that optimizes cold outreach for sales reps",
    "pricing_model": "freemium",
    "url": "https://www.lavender.ai",
    "rating": null,
    "source": "fallback"
  }
];

await Actor.init();

try {
  const input = await Actor.getInput<{ mode?: string; maxResults?: number }>();
  const mode = input?.mode ?? 'compare-tools';
  const maxResults = Math.min(input?.maxResults ?? 25, 200);

  log.info('Starting actor', { mode, maxResults, slug: 'ai-agents-for-sales' });

  const results: ToolResult[] = [];
  const startTime = Date.now();
  const scraped_at = new Date().toISOString();
  const sourceErrors: string[] = [];

  // ── Source 1: Futurepedia (primary — no Cloudflare, open HTML) ──────────
  const futurepediaCrawler = new CheerioCrawler({
    maxRequestsPerCrawl: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ $ }) {
      log.info('Futurepedia page loaded');

      // Try multiple selector patterns in priority order
      const selectorGroups = [
        '[class*="ToolCard"]',
        '[class*="tool-card"]',
        'article',
        'section > div > div',
        '.grid > div',
      ];

      let extractedCount = 0;
      for (const sel of selectorGroups) {
        const els = $(sel).toArray();
        if (els.length < 2) continue;

        for (const el of els) {
          const name = $(el)
            .find('h2, h3, [class*="name"], [class*="title"], strong')
            .first()
            .text()
            .trim();
          const desc = $(el)
            .find('p, [class*="desc"], [class*="tagline"], [class*="subtitle"]')
            .first()
            .text()
            .trim();

          if (name.length >= 2 && name.length <= 100 && !name.includes('{')) {
            results.push({
              name,
              vendor: name,
              description: desc || 'AI tool in this category',
              pricing_model: 'unknown',
              rating: null,
              source: 'futurepedia',
              url: 'https://www.futurepedia.io/ai-tools/sales',
              scraped_at,
            });
            extractedCount++;
          }
        }
        if (extractedCount >= 5) break;
      }

      if (extractedCount === 0) {
        log.warning('Futurepedia: no items extracted — page may have changed', {
          htmlPreview: $.html().slice(0, 400),
        });
      } else {
        log.info(`Futurepedia: ${extractedCount} items`);
      }
    },
  });

  try {
    await futurepediaCrawler.run(['https://www.futurepedia.io/ai-tools/sales']);
  } catch (err) {
    log.warning('Futurepedia scrape failed', { error: String(err) });
    sourceErrors.push('futurepedia');
  }

  // ── Source 2: TopAI.tools (secondary — no Cloudflare, open HTML) ───────
  if (results.length < 5) {
    const topaiCrawler = new CheerioCrawler({
      maxRequestsPerCrawl: 1,
      requestHandlerTimeoutSecs: 30,
      async requestHandler({ $ }) {
        log.info('TopAI.tools page loaded');
        const selectorGroups = [
          '[class*="tool"]',
          '[class*="card"]',
          'article',
          'li',
        ];
        let extractedCount = 0;
        for (const sel of selectorGroups) {
          const els = $(sel).toArray();
          if (els.length < 2) continue;
          for (const el of els) {
            const name = $(el)
              .find('h2, h3, [class*="name"], [class*="title"]')
              .first()
              .text()
              .trim();
            const desc = $(el)
              .find('p, [class*="desc"]')
              .first()
              .text()
              .trim();
            if (name.length >= 2 && name.length <= 100 && !name.includes('{')) {
              results.push({
                name,
                vendor: name,
                description: desc || 'AI tool',
                pricing_model: 'unknown',
                rating: null,
                source: 'topai',
                url: 'https://topai.tools/top-100-ai-tools',
                scraped_at,
              });
              extractedCount++;
            }
          }
          if (extractedCount >= 5) break;
        }
        log.info(`TopAI: ${extractedCount} items`);
      },
    });
    try {
      await topaiCrawler.run(['https://topai.tools/top-100-ai-tools']);
    } catch (err) {
      log.warning('TopAI scrape failed', { error: String(err) });
      sourceErrors.push('topai');
    }
  }

  // ── Fallback: hardcoded vendor list (guarantees >= 1 result) ────────────
  if (results.length === 0) {
    log.warning('All sources returned 0 results — using hardcoded fallback list.');
    for (const v of FALLBACK_VENDORS) {
      results.push({ ...v, scraped_at });
    }
  }

  // ── Deduplication + sorting ──────────────────────────────────────────────
  const seen = new Set<string>();
  const deduped = results
    .filter((r) => {
      const key = r.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name))
    .slice(0, maxResults);

  // ── Push results ─────────────────────────────────────────────────────────
  await Actor.pushData(deduped);
  await Actor.setValue('OUTPUT', {
    results: deduped,
    metadata: {
      total_results: deduped.length,
      mode,
      sources_scraped: ['futurepedia', 'topai'],
      sources_failed: sourceErrors,
      used_fallback: results.length > 0 && deduped.every((r) => r.source === 'fallback'),
      run_duration_seconds: Math.round((Date.now() - startTime) / 1000),
    },
  });

  log.info(`Done. Pushed ${deduped.length} results.`);
} finally {
  await Actor.exit();
}
