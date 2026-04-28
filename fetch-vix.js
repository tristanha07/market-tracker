require('dotenv').config();
const axios = require('axios');

async function getVix() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d';

  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const price = response.data.chart.result[0].meta.regularMarketPrice;
  console.log('--- VIX ---');
  console.log(`Current VIX: ${price}`);

  if (price > 30) {
    console.log('SIGNAL: Clear — VIX above 30 (high fear)');
  } else {
    console.log('SIGNAL: Caution — VIX below 30');
  }
}

getVix();