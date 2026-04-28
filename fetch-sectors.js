require('dotenv').config();
const axios = require('axios');

// These are the 11 sector ETFs — free from Yahoo, no key needed
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

async function getLeadingSector() {
  console.log('--- Sector Performance ---');
  const results = [];

  for (const sector of SECTORS) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sector.ticker}?interval=1d&range=5d`;
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const meta = res.data.chart.result[0].meta;
      const change = ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100);
      results.push({ ...sector, change });
    } catch (e) {
      console.log(`${sector.ticker}: could not fetch`);
    }
  }

  // Sort best to worst
  results.sort((a, b) => b.change - a.change);
  results.forEach(s => {
    const arrow = s.change >= 0 ? '▲' : '▼';
    console.log(`${arrow} ${s.name}: ${s.change.toFixed(2)}%`);
  });

  const top = results[0];
  console.log(`\nLeading sector: ${top.name} (${top.change.toFixed(2)}%)`);
  if (top.change > 1.0) {
    console.log('SIGNAL: CLEAR — strong leading sector');
  } else {
    console.log('SIGNAL: CAUTION — no clear sector leader');
  }
}

getLeadingSector();