import fetch from "node-fetch";
import { getToken } from "./lib/auth.js";

async function fetchQuote(token, ticker) {
  console.log(`Fetching quote for ${ticker}...`);
  const url = `https://api.invertironline.com/api/v2/bCBA/Titulos/${ticker}/CotizacionDetalle`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error(`Failed to fetch ${ticker}:`, response.status, response.statusText);
    throw new Error(`Failed to fetch ${ticker}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.puntas || !Array.isArray(data.puntas) || data.puntas.length === 0) {
    console.error(`Invalid puntas data for ${ticker}:`, data.puntas);
    throw new Error(`Invalid or missing puntas data for ${ticker}`);
  }

  console.log(`Quote for ${ticker} fetched successfully`);
  return data;
}

const bondPairs = [
  { dollar: "AL29D", peso: "AL29" },
  { dollar: "AL30D", peso: "AL30" },
  { dollar: "AE38D", peso: "AE38" },
  { dollar: "AL35D", peso: "AL35" },
  { dollar: "AL41D", peso: "AL41" },
  { dollar: "GD29D", peso: "GD29" },
  { dollar: "GD30D", peso: "GD30" },
  { dollar: "GD38D", peso: "GD38" },
  { dollar: "GD35D", peso: "GD35" },
  { dollar: "GD46D", peso: "GD46" },
  { dollar: "GD41D", peso: "GD41" }
];

async function calculateMEPForPair(token, dollarBond, pesoBond) {
  const [dollarQuote, pesoQuote] = await Promise.all([
    fetchQuote(token, dollarBond.toLowerCase()),
    fetchQuote(token, pesoBond.toLowerCase())
  ]);

  if (!dollarQuote.puntas[0].precioCompra) {
    throw new Error(`Missing precioCompra for ${dollarBond}`);
  }
  if (!pesoQuote.puntas[0].precioVenta) {
    throw new Error(`Missing precioVenta for ${pesoBond}`);
  }

  const dollarBuyPrice = dollarQuote.puntas[0].precioCompra;
  const dollarCommissionFee = dollarBuyPrice * 0.49 / 100;
  const dollarMarketFee = dollarBuyPrice * 0.01 / 100;
  
  const pesoSellPrice = pesoQuote.puntas[0].precioVenta;
  const pesoMarketFee = pesoSellPrice * 0.01 / 100;

  const dollarFinal = dollarBuyPrice + dollarCommissionFee + dollarMarketFee;
  const pesoFinal = pesoSellPrice - pesoMarketFee;

  const mep = pesoFinal / dollarFinal;

  return {
    pair: `${dollarBond}/${pesoBond}`,
    dollarBond,
    pesoBond,
    dollarBuyPrice: dollarBuyPrice.toFixed(4),
    dollarCommissionFee: dollarCommissionFee.toFixed(4),
    dollarMarketFee: dollarMarketFee.toFixed(4),
    pesoSellPrice: pesoSellPrice.toFixed(4),
    pesoMarketFee: pesoMarketFee.toFixed(4),
    mepRate: mep.toFixed(4)
  };
}

export const handler = async (event, context) => {
  console.log('MEP calculation request received');
  
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    console.log('OPTIONS request handled');
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    console.log('Starting authentication...');
    const token = await getToken();
    
    console.log('Calculating MEP for all bond pairs...');
    const results = await Promise.all(
      bondPairs.map(pair => calculateMEPForPair(token, pair.dollar, pair.peso))
    );

    console.log('MEP calculations completed for all pairs');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ bonds: results })
    };
  } catch (error) {
    console.error('MEP calculation error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};