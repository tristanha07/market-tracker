require('dotenv').config();
const axios = require('axios');

async function getMarginDebt() {
  const key = process.env.FRED_API_KEY;
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DPSACBW027SBOG&api_key=${key}&file_type=json&sort_order=desc&limit=3`;

  const response = await axios.get(url);
  const observations = response.data.observations;

  console.log('--- FINRA Margin Debt (last 3 months) ---');
  observations.forEach(obs => {
    const billions = (parseFloat(obs.value) / 1000).toFixed(1);
    console.log(`${obs.date}: $${billions}B`);
  });

  const current = parseFloat(observations[0].value);
  const previous = parseFloat(observations[1].value);

  if (current < previous) {
    console.log('SIGNAL: CLEAR — margin debt is decreasing (deleveraging)');
  } else {
    console.log('SIGNAL: CAUTION — margin debt is increasing');
  }
}

getMarginDebt();