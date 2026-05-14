// ─────────────────────────────────────────────────────────────
// priceService.js — Yahoo Finance live price fetcher
// Uses the Vite dev proxy at /api/yahoo → query2.finance.yahoo.com
// ─────────────────────────────────────────────────────────────

// Symbols that are Real Estate (cannot be fetched from YF)
const SKIP_SYMBOLS = new Set(['RE-BLR', 'RE-MUM', 'RE1', 'GOLD', 'SLV']);

/**
 * Fetch live prices for an array of Yahoo Finance symbols.
 * Returns a map: { [symbol]: { price, currency, change, changePercent } }
 *
 * Falls back gracefully — symbols that fail simply keep their existing price.
 */
export async function fetchLivePrices(symbols) {
  const fetchable = symbols.filter(s => !SKIP_SYMBOLS.has(s));
  if (!fetchable.length) return {};

  const hasGlobal = fetchable.some(s => !s.endsWith('.NS') && !s.endsWith('.BO'));
  const symbolsToFetch = hasGlobal && !fetchable.includes('USDINR=X') 
    ? [...fetchable, 'USDINR=X'] 
    : fetchable;

  const result = {};
  
  // We'll fetch in small concurrent chunks to avoid 429s while bypassing 401s
  const CONCURRENCY = 5;
  for (let i = 0; i < symbolsToFetch.length; i += CONCURRENCY) {
    const chunk = symbolsToFetch.slice(i, i + CONCURRENCY);
    
    await Promise.all(chunk.map(async (symbol) => {
      try {
        // v8 chart endpoint is generally more permissive and doesn't require crumbs
        const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
        const resp = await fetch(url);
        
        if (!resp.ok) {
          console.warn(`[priceService] Failed to fetch ${symbol}: ${resp.status}`);
          return;
        }

        const json = await resp.json();
        const meta = json?.chart?.result?.[0]?.meta;
        
        if (meta && meta.regularMarketPrice != null) {
          result[symbol] = {
            price: meta.regularMarketPrice,
            currency: meta.currency ?? 'INR',
            change: (meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) || 0,
            changePercent: (((meta.regularMarketPrice / (meta.previousClose || meta.chartPreviousClose)) - 1) * 100) || 0,
          };
        }
      } catch (err) {
        console.error(`[priceService] Error for ${symbol}:`, err.message);
      }
    }));

    // Small delay between chunks to be safe
    if (symbolsToFetch.length > CONCURRENCY) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return result;
}

/**
 * Fetch a single symbol's price.
 */
export async function fetchSinglePrice(symbol) {
  const res = await fetchLivePrices([symbol]);
  return res[symbol] || null;
}
