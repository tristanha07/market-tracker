require('dotenv').config();
const axios = require('axios');

async function getSignal(name, value, isGood, clearMsg, cautionMsg) {
  const signal = isGood ? 'CLEAR' : 'CAUTION';
  const icon = isGood ? '[OK]' : '[!!]';
  console.log(`${icon} ${name}: ${value} — ${isGood ? clearMsg : cautionMsg}`);
  return { name, value, signal };
}

async function fetchAll() {
  const key = process.env.FRED_API_KEY;
  console.log('========================================');
  console.log('   MARKET CONDITIONS REPORT');
  console.log('   ' + new Date().toDateString());
  console.log('========================================\n');

  // VIX
  const vixRes = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const vix = vixRes.data.chart.result[0].meta.regularMarketPrice;
  await getSignal('VIX', vix.toFixed(2), vix <= 30, 'low fear', 'high fear — caution');

  // Fed rate
  const fedRes = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${key}&file_type=json&sort_order=desc&limit=2`);
  const fedObs = fedRes.data.observations;
  const fedCurrent = parseFloat(fedObs[0].value);
  const fedPrev = parseFloat(fedObs[1].value);
  await getSignal('Fed Rate', `${fedCurrent}%`, fedCurrent <= fedPrev, 'flat or falling', 'rising');

  // Margin debt
  const marginRes = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=DPSACBW027SBOG&api_key=${key}&file_type=json&sort_order=desc&limit=3`);
  const marginObs = marginRes.data.observations;
  const mCurrent = parseFloat(marginObs[0].value);
  const mPrev = parseFloat(marginObs[1].value);
  const mBillions = (mCurrent / 1000).toFixed(1);
  await getSignal('Margin Debt', `$${mBillions}B`, mCurrent < mPrev, 'decreasing', 'increasing');

  console.log('\n========================================');
}

fetchAll().catch(console.error);