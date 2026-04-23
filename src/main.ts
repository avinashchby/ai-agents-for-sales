import { Actor } from 'apify';
import { CheerioCrawler, RequestList } from 'crawlee';
import type { CheerioAPI } from 'cheerio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Input {
  maxResults?: number;
  minRating?: number;
  salesTasks?: string[];
  pricingModel?: string;
  sources?: string[];
}

interface SalesTool {
  name: string;
  vendor: string;
  description: string;
  sales_tasks: string[];
  pricing_model: string;
  starting_price_usd: number | null;
  rating: number | null;
  review_count: number | null;
  integrations: string[];
  source: string;
  url: string;
  scraped_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SALES_TASK_KEYWORDS: Record<string, string[]> = {
  prospecting: ['prospect', 'prospecting', 'lead generation', 'find leads', 'lead discovery', 'sdr'],
  outreach: ['outreach', 'sequence', 'email sequence', 'cold email', 'cadence', 'engagement'],
  coaching: ['coaching', 'call coaching', 'conversation intelligence', 'call analysis', 'sales coaching'],
  forecasting: ['forecasting', 'forecast', 'pipeline forecast', 'revenue forecast', 'deal intelligence'],
};

const PRICING_KEYWORDS: Record<string, string[]> = {
  free: ['free plan', 'free tier', 'always free', 'no cost'],
  freemium: ['freemium', 'free trial', 'free forever', 'starter free'],
  paid: ['per month', 'per user', 'per seat', '/month', '/year', 'subscription'],
  enterprise: ['enterprise', 'contact sales', 'custom pricing', 'quote'],
};

const SOURCE_URLS: Record<string, string> = {
  g2: 'https://www.g2.com/categories/sales-intelligence',
  capterra: 'https://www.capterra.com/sales-force-automation-software/',
  producthunt: 'https://www.producthunt.com/search?q=ai+sales+agent',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Infer sales tasks from a block of text. */
function inferSalesTasks(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(SALES_TASK_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([task]) => task);
}

/** Infer pricing model from a block of text. */
function inferPricingModel(text: string): string {
  const lower = text.toLowerCase();
  for (const [model, keywords] of Object.entries(PRICING_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return model;
  }
  return 'unknown';
}

/** Parse a rating string like "4.5 out of 5" or "4.5/5" to a float. */
function parseRating(raw: string): number | null {
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  // G2/Capterra rate out of 5; ProductHunt votes are not ratings — handled separately
  return val <= 5 ? val : null;
}

/** Parse a review count string like "2,150 reviews" to an integer. */
function parseReviewCount(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits.length > 0 ? parseInt(digits, 10) : null;
}

/** Parse a starting price string to a USD number. */
function parsePrice(raw: string): number | null {
  const match = raw.match(/\$(\d+(?:,\d+)?(?:\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

// ---------------------------------------------------------------------------
// Source-specific scrapers
// ---------------------------------------------------------------------------

/** Parse G2 category page product cards. */
function parseG2($: CheerioAPI, pageUrl: string): SalesTool[] {
  const results: SalesTool[] = [];
  const scraped_at = new Date().toISOString();

  $('[data-has-reviews]').each((_, el) => {
    const card = $(el);
    const name = card.find('[data-product-name]').text().trim()
      || card.find('.product-listing__product-name').text().trim()
      || card.find('h3').first().text().trim();
    if (!name) return;

    const vendor = card.find('.product-listing__vendor').text().trim() || name;
    const description = card.find('.product-listing__description, p.mb-0').text().trim();
    const ratingRaw = card.find('[data-rating]').attr('data-rating')
      || card.find('.rating-stars__star--full').length.toString();
    const rating = parseRating(ratingRaw);
    const reviewRaw = card.find('.reviews-count, [data-reviews-count]').text().trim();
    const review_count = parseReviewCount(reviewRaw);
    const priceRaw = card.find('.price-tag, .product-listing__price').text().trim();
    const starting_price_usd = parsePrice(priceRaw);
    const pricing_model = inferPricingModel(`${description} ${priceRaw}`);
    const sales_tasks = inferSalesTasks(description);

    const relPath = card.find('a[href*="/products/"]').attr('href') || '';
    const url = relPath.startsWith('http') ? relPath : `https://www.g2.com${relPath}`;

    results.push({
      name,
      vendor,
      description,
      sales_tasks,
      pricing_model,
      starting_price_usd,
      rating,
      review_count,
      integrations: [],
      source: 'g2',
      url: url || pageUrl,
      scraped_at,
    });
  });

  // Fallback: some G2 pages use a different structure
  if (results.length === 0) {
    $('div.product-listing').each((_, el) => {
      const card = $(el);
      const name = card.find('a.product-listing__product-name').text().trim();
      if (!name) return;
      const description = card.find('p').first().text().trim();
      const ratingRaw = card.find('.rating').attr('data-rating') || '0';
      const rating = parseRating(ratingRaw);
      const url = card.find('a.product-listing__product-name').attr('href') || pageUrl;

      results.push({
        name,
        vendor: name,
        description,
        sales_tasks: inferSalesTasks(description),
        pricing_model: inferPricingModel(description),
        starting_price_usd: null,
        rating,
        review_count: null,
        integrations: [],
        source: 'g2',
        url: url.startsWith('http') ? url : `https://www.g2.com${url}`,
        scraped_at,
      });
    });
  }

  return results;
}

/** Parse Capterra listing page product cards. */
function parseCapterra($: CheerioAPI, pageUrl: string): SalesTool[] {
  const results: SalesTool[] = [];
  const scraped_at = new Date().toISOString();

  $('[data-testid="product-card"], .sc-fznLPX, article[class*="SoftwareCard"]').each((_, el) => {
    const card = $(el);
    const name = card.find('h3, [data-testid="product-name"]').first().text().trim();
    if (!name) return;

    const vendor = card.find('[data-testid="vendor-name"], .vendor-name').text().trim() || name;
    const description = card.find('p, [data-testid="product-description"]').first().text().trim();
    const ratingRaw = card.find('[data-testid="overall-rating"], .overall-rating').text().trim();
    const rating = parseRating(ratingRaw);
    const reviewRaw = card.find('[data-testid="reviews-count"], .reviews-count').text().trim();
    const review_count = parseReviewCount(reviewRaw);
    const priceRaw = card.find('[data-testid="price"], .price').text().trim();
    const starting_price_usd = parsePrice(priceRaw);
    const pricing_model = inferPricingModel(`${description} ${priceRaw}`);
    const sales_tasks = inferSalesTasks(description);

    const href = card.find('a[href*="/p/"]').attr('href') || '';
    const url = href.startsWith('http') ? href : `https://www.capterra.com${href}`;

    results.push({
      name,
      vendor,
      description,
      sales_tasks,
      pricing_model,
      starting_price_usd,
      rating,
      review_count,
      integrations: [],
      source: 'capterra',
      url: url || pageUrl,
      scraped_at,
    });
  });

  return results;
}

/** Parse Product Hunt search results page. */
function parseProductHunt($: CheerioAPI, pageUrl: string): SalesTool[] {
  const results: SalesTool[] = [];
  const scraped_at = new Date().toISOString();

  $('li[class*="item"], div[class*="PostItem"], section[class*="post"]').each((_, el) => {
    const card = $(el);
    const name = card.find('h3, [class*="title"], [class*="name"]').first().text().trim();
    if (!name) return;

    const description = card.find('p, [class*="tagline"], [class*="description"]').first().text().trim();
    const votesRaw = card.find('[class*="vote"], [data-test="vote-button"]').text().trim();
    // ProductHunt uses upvotes, not a 0–5 rating — we skip the rating field
    const review_count = parseReviewCount(votesRaw);
    const href = card.find('a[href*="/posts/"]').attr('href') || '';
    const url = href.startsWith('http') ? href : `https://www.producthunt.com${href}`;

    results.push({
      name,
      vendor: name,
      description,
      sales_tasks: inferSalesTasks(description),
      pricing_model: inferPricingModel(description),
      starting_price_usd: null,
      rating: null,
      review_count,
      integrations: [],
      source: 'producthunt',
      url: url || pageUrl,
      scraped_at,
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** Apply all user-specified filters to a flat list of tools. */
function applyFilters(
  tools: SalesTool[],
  minRating: number,
  pricingModel: string,
  salesTasks: string[],
): SalesTool[] {
  return tools.filter((tool) => {
    if (tool.rating !== null && tool.rating < minRating) return false;
    if (tool.rating === null && minRating > 0) return false;

    if (pricingModel !== 'all' && tool.pricing_model !== pricingModel) return false;

    if (salesTasks.length > 0) {
      const hasTask = salesTasks.some((t) => tool.sales_tasks.includes(t));
      if (!hasTask) return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

await Actor.init();

const input = (await Actor.getInput<Input>()) ?? {};
const maxResults = input.maxResults ?? 25;
const minRating = input.minRating ?? 0;
const salesTasks = input.salesTasks ?? [];
const pricingModel = input.pricingModel ?? 'all';
const sources = input.sources ?? ['g2', 'capterra', 'producthunt'];

const startTime = Date.now();
const allTools: SalesTool[] = [];

const proxyConfig = await Actor.createProxyConfiguration({
  groups: ['RESIDENTIAL'],
});

// Build request list from enabled sources
const requestUrls = sources
  .filter((s) => SOURCE_URLS[s])
  .map((s) => ({ url: SOURCE_URLS[s], userData: { source: s } }));

const requestList = await RequestList.open(null, requestUrls);

const crawler = new CheerioCrawler({
  requestList,
  proxyConfiguration: proxyConfig,
  minConcurrency: 1,
  maxConcurrency: 2,
  requestHandlerTimeoutSecs: 30,
  navigationTimeoutSecs: 30,
  // 2-second delay between requests as required
  requestHandler: async ({ $, request }) => {
    const { source } = request.userData as { source: string };
    const pageUrl = request.url;
    let parsed: SalesTool[] = [];

    if (source === 'g2') {
      parsed = parseG2($, pageUrl);
    } else if (source === 'capterra') {
      parsed = parseCapterra($, pageUrl);
    } else if (source === 'producthunt') {
      parsed = parseProductHunt($, pageUrl);
    }

    allTools.push(...parsed);
  },
  failedRequestHandler: async ({ request }) => {
    console.warn(`[WARN] Request failed: ${request.url}`);
  },
  // 2-second delay between requests
  maxRequestsPerMinute: 30,
});

await crawler.run();

// Apply filters and cap at maxResults
const filtered = applyFilters(allTools, minRating, pricingModel, salesTasks);
const results = filtered.slice(0, maxResults);

const run_duration_seconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
const sources_scraped = [...new Set(results.map((r) => r.source))];

// Push individual items to the default dataset
await Actor.pushData(results);

// Push summary output to named key-value store entry
await Actor.setValue('OUTPUT', {
  results,
  metadata: {
    total_results: results.length,
    run_duration_seconds,
    sources_scraped,
  },
});

console.log(`Done. ${results.length} tools returned in ${run_duration_seconds}s from [${sources_scraped.join(', ')}].`);

await Actor.exit();
