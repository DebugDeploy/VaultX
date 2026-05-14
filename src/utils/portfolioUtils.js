/**
 * portfolioUtils.js
 * Pure, self-contained portfolio utility functions.
 * Replaces the old mockData.js — zero mock data, only calculations.
 */

// ── Summary ────────────────────────────────────────────────────────
/**
 * Calculate portfolio summary from an array of assets.
 * @param {Array} assets — list of asset objects
 * @param {string} [type] — optional asset type filter
 */
export const calculateSummary = (assets, type) => {
  const filtered = type ? assets.filter(a => a.type === type) : assets;

  const totalInvested = filtered.reduce((sum, a) => {
    const price = Number(a.avgPriceINR || a.avgPrice || 0);
    const qty   = Number(a.quantity || 0);
    return sum + price * qty;
  }, 0);

  const currentValue = filtered.reduce((sum, a) => {
    const price = Number(a.currentPriceINR || a.currentPrice || a.avgPrice || 0);
    const qty   = Number(a.quantity || 0);
    return sum + price * qty;
  }, 0);

  const profitLoss = currentValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return { totalInvested, currentValue, profitLoss, profitPercentage };
};

// ── Allocation by Asset Type ───────────────────────────────────────
export const getAllocationData = (assets) => {
  const typeMap = {};
  assets.forEach(a => {
    const type = a.type || 'Other';
    const value = Number(a.currentPriceINR || a.currentPrice || a.avgPrice || 0) * Number(a.quantity || 0);
    typeMap[type] = (typeMap[type] || 0) + value;
  });

  return Object.entries(typeMap)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
};

// ── Allocation by Owner ────────────────────────────────────────────
export const getOwnerAllocationData = (assets) => {
  const ownerMap = {};
  assets.forEach(a => {
    const owner = a.owner || a.ownerUid || 'Unknown';
    const value = Number(a.currentPriceINR || a.currentPrice || a.avgPrice || 0) * Number(a.quantity || 0);
    ownerMap[owner] = (ownerMap[owner] || 0) + value;
  });

  return Object.entries(ownerMap)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
};

// ── Performance Data (simulated trend line) ────────────────────────
/**
 * Generates a synthetic performance curve for charts.
 * Uses a random walk seeded by the current date so the chart
 * feels alive but isn't tied to real historical data.
 */
export const generatePerformanceData = (days = 30) => {
  const data = [];
  const today = new Date();
  let value = 500000 + Math.random() * 200000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const volatility = 0.015;
    const drift = 0.001;
    const change = (Math.random() - 0.5) * 2 * volatility + drift;
    value = value * (1 + change);

    const label =
      days <= 1
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : days <= 7
          ? date.toLocaleDateString([], { weekday: 'short' })
          : days <= 60
            ? date.toLocaleDateString([], { day: 'numeric', month: 'short' })
            : date.toLocaleDateString([], { month: 'short', year: '2-digit' });

    data.push({ date: label, value: Math.round(value) });
  }

  return data;
};
