import fetch from "node-fetch";
import { getToken } from "js-utils/invertironline/auth.js";

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
    if (!data.ultimoPrecio) {
      console.error(`No puntas or ultimoPrecio data for ${ticker}:`, { puntas: data.puntas, ultimoPrecio: data.ultimoPrecio });
      throw new Error(`No price data available for ${ticker}`);
    }
    console.log(`Using ultimoPrecio for ${ticker} (puntas not available)`);
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

function getPriceFromQuote(quote, priceType, bondName) {
  if (quote.puntas && Array.isArray(quote.puntas) && quote.puntas.length > 0) {
    const price = priceType === 'buy' ? quote.puntas[0].precioCompra : quote.puntas[0].precioVenta;
    if (price) {
      return price;
    }
  }
  
  if (quote.ultimoPrecio) {
    console.log(`Using ultimoPrecio for ${bondName} ${priceType} price`);
    return quote.ultimoPrecio;
  }
  
  throw new Error(`No ${priceType} price available for ${bondName}`);
}

async function calculateMEPForPair(token, dollarBond, pesoBond) {
  const [dollarQuote, pesoQuote] = await Promise.all([
    fetchQuote(token, dollarBond.toLowerCase()),
    fetchQuote(token, pesoBond.toLowerCase())
  ]);

  const dollarBuyPrice = getPriceFromQuote(dollarQuote, 'buy', dollarBond);
  const dollarCommissionFee = dollarBuyPrice * 0.49 / 100;
  const dollarMarketFee = dollarBuyPrice * 0.01 / 100;
  
  const pesoSellPrice = getPriceFromQuote(pesoQuote, 'sell', pesoBond);
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