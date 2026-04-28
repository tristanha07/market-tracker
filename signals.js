require('dotenv').config();
const axios = require('axios');

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

async function runSignals() {
  const fredKey = process.env.FRED_API_KEY;
  const results = [];

  console.log('==========================================');
  console.log('   MARKET CONDITIONS SCORECARD');
  console.log('   ' + new Date().toDateString());
  console.log('==========================================\n');

  // --- SIGNAL 1: VIX ---
  try {
    const res = await axios.get(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const vix = res.data.chart.result[0].meta.regularMarketPrice;
    const clear = vix <= 30;
    results.push({ name: 'VIX', value: vix.toFixed(2), clear });
    console.log(`${clear ? '[OK]' : '[!!]'} VIX: ${vix.toFixed(2)} — ${clear ? 'below 30, calm market' : 'ABOVE 30, high fear'}`);
  } catch (e) {
    console.log('[??] VIX: could not fetch');
  }

  // --- SIGNAL 2: Fed Rate ---
  try {
    const res = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredKey}&file_type=json&sort_order=desc&limit=2`
    );
    const obs = res.data.observations;
    const current = parseFloat(obs[0].value);
    const prev = parseFloat(obs[1].value);
    const clear = current <= prev;
    results.push({ name: 'Fed Rate', value: `${current}%`, clear });
    console.log(`${clear ? '[OK]' : '[!!]'} Fed Rate: ${current}% — ${clear ? 'flat or falling' : 'rising'}`);
  } catch (e) {
    console.log('[??] Fed Rate: could not fetch');
  }

  // --- SIGNAL 3: Margin Debt ---
  try {
    const res = await axios.get(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DPSACBW027SBOG&api_key=${fredKey}&file_type=json&sort_order=desc&limit=2`
    );
    const obs = res.data.observations;
    const current = parseFloat(obs[0].value);
    const prev = parseFloat(obs[1].value);
    const clear = current < prev;
    results.push({ name: 'Margin Debt', value: `$${(current / 1000).toFixed(1)}B`, clear });
    console.log(`${clear ? '[OK]' : '[!!]'} Margin Debt: $${(current / 1000).toFixed(1)}B — ${clear ? 'decreasing' : 'increasing'}`);
  } catch (e) {
    console.log('[??] Margin Debt: could not fetch');
  }

  // --- SIGNAL 4: Leading Sector ---
  try {
    const sectorResults = [];
    for (const s of SECTORS) {
      const res = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${s.ticker}?interval=1d&range=5d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const meta = res.data.chart.result[0].meta;
      const change = (meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100;
      sectorResults.push({ ...s, change });
    }
    sectorResults.sort((a, b) => b.change - a.change);
    const top = sectorResults[0];
    const clear = top.change > 1.0;
    results.push({ name: 'Leading Sector', value: `${top.name} ${top.change.toFixed(2)}%`, clear });
    console.log(`${clear ? '[OK]' : '[!!]'} Leading Sector: ${top.name} (${top.change.toFixed(2)}%) — ${clear ? 'clear leader' : 'no clear leader'}`);

    console.log('\n   All sectors:');
    sectorResults.forEach(s => {
      const arrow = s.change >= 0 ? '▲' : '▼';
      console.log(`   ${arrow} ${s.name}: ${s.change.toFixed(2)}%`);
    });
  } catch (e) {
    console.log('[??] Leading Sector: could not fetch');
  }

  // --- FINAL SCORE ---
  const clearCount = results.filter(r => r.clear).length;
  const total = results.length;

  console.log('\n==========================================');
  console.log(`SCORE: ${clearCount} / ${total} conditions met`);

  if (clearCount >= 3) {
    console.log('OVERALL: BUY CONDITIONS — majority of signals clear');
  } else if (clearCount === 2) {
    console.log('OVERALL: WAIT — mixed signals');
  } else {
    console.log('OVERALL: CAUTION — majority of signals negative');
  }
  console.log('==========================================');
}

runSignals().catch(console.error);