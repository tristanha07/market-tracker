require('dotenv').config();
const axios = require('axios');

async function getFedRate() {
  const key = process.env.FRED_API_KEY;
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${key}&file_type=json&sort_order=desc&limit=3`;

  const response = await axios.get(url);
  const observations = response.data.observations;

  console.log('--- Fed Funds Rate (last 3 months) ---');
  observations.forEach(obs => {
    console.log(`${obs.date}: ${obs.value}%`);
  });

  const current = parseFloat(observations[0].value);
  const previous = parseFloat(observations[1].value);

  if (current <= previous) {
    console.log('SIGNAL: CLEAR — rate is flat or falling');
  } else {
    console.log('SIGNAL: CAUTION — rate is rising');
  }
}

getFedRate();