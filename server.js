require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const SECTORS = [
  { ticker: 'XLK', name: 'Technology' },
  { ticker: 'XLF', name: 'Financials' },
  { ticker: 'XLV', name: 'Healthcare' },
  { ticker: 'XLE', name: 'Energy' },
  { ticker: 'XLY', name: 'Consumer Discretionary' },
  { ticker: 'XLI', name: 'Industrials' },
  { ticker: 'XLB', name: 'Materials' },
  { ticker: 'XLP', name: 'Consumer Staples' },
  { ticker: 'XLU', name: 'Utilities' },
  { ticker: 'XLRE', name: 'Real Estate' },
  { ticker: 'XLC', name: 'Communications' },
];

app.get('/api/signals', async (req, res) => {
  const fredKey = process.env.FRED_API_KEY;
  const signals = [];

  // VIX
  try {
    const r = await axios.get(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const vix = r.data.chart.result[0].meta.regularMarketPrice;
    signals.push({
      name: 'VIX',
      value: vix.toFixed(2),
      clear: vix >= 30,
      description: vix <= 30 ? 'Below 30 — calm market' : 'Above 30 — high fear',
    });
  } catch (e) {
    signals.push({ name: 'VIX', value: 'N/A', clear: null, description: 'Could not fetch' });
  }

  // Fed Rate
  try {
    const r = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredKey}&file_type=json&sort_order=desc&limit=2`
    );
    const obs = r.data.observations;
    const current = parseFloat(obs[0].value);
    const prev = parseFloat(obs[1].value);
    const clear = current <= prev;
    signals.push({
      name: 'Fed Rate',
      value: `${current}%`,
      clear,
      description: clear ? 'Flat or falling' : 'Rising — caution',
    });
  } catch (e) {
    signals.push({ name: 'Fed Rate', value: 'N/A', clear: null, description: 'Could not fetch' });
  }

  // Margin Debt
  try {
    const r = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DPSACBW027SBOG&api_key=${fredKey}&file_type=json&sort_order=desc&limit=2`
    );
    const obs = r.data.observations;
    const current = parseFloat(obs[0].value);
    const prev = parseFloat(obs[1].value);
    const clear = current < prev;
    signals.push({
      name: 'Margin Debt',
      value: `$${(current / 1000).toFixed(1)}B`,
      clear,
      description: clear ? 'Decreasing — deleveraging' : 'Increasing — caution',
    });
  } catch (e) {
    signals.push({ name: 'Margin Debt', value: 'N/A', clear: null, description: 'Could not fetch' });
  }

  // Leading Sector
  try {
    const sectorResults = [];
    for (const s of SECTORS) {
      const r = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${s.ticker}?interval=1d&range=5d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const meta = r.data.chart.result[0].meta;
      const change = (meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100;
      sectorResults.push({ ...s, change });
    }
    sectorResults.sort((a, b) => b.change - a.change);
    const top = sectorResults[0];
    const clear = top.change > 1.0;
    signals.push({
      name: 'Leading Sector',
      value: top.name,
      change: top.change.toFixed(2),
      clear,
      description: clear ? `${top.name} up ${top.change.toFixed(2)}%` : 'No clear leader',
      sectors: sectorResults,
    });
  } catch (e) {
    signals.push({ name: 'Leading Sector', value: 'N/A', clear: null, description: 'Could not fetch' });
  }

  res.json({ signals, timestamp: new Date().toISOString() });
});

app.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});