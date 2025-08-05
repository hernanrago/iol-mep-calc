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
    const [al30d, al30] = await Promise.all([
      fetchQuote(token, "al30d"),
      fetchQuote(token, "al30")
    ]);

    if (!al30d.puntas[0].precioCompra) {
      throw new Error('Missing precioCompra for AL30D');
    }
    if (!al30.puntas[0].precioVenta) {
      throw new Error('Missing precioVenta for AL30');
    }

    const al30dBuyPrice = al30d.puntas[0].precioCompra;
    const al30dCommissionFee = al30dBuyPrice * 0.49 / 100;
    const al30dMarketFee = al30dBuyPrice * 0.01 / 100;
    
    const al30SellPrice = al30.puntas[0].precioVenta;
    const al30MarketFee = al30SellPrice * 0.01 / 100;

    const al30dFinal = al30dBuyPrice + al30dCommissionFee + al30dMarketFee;
    const al30Final = al30SellPrice - al30MarketFee;

    const mep = al30Final / al30dFinal;

    console.log('MEP calculation completed:', {
      mepRate: mep.toFixed(4),
      al30dBuyPrice: al30dBuyPrice.toFixed(4),
      al30SellPrice: al30SellPrice.toFixed(4)
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        al30dBuyPrice: al30dBuyPrice.toFixed(4),
        al30dCommissionFee: al30dCommissionFee.toFixed(4),
        al30dMarketFee: al30dMarketFee.toFixed(4),
        al30SellPrice: al30SellPrice.toFixed(4),
        al30MarketFee: al30MarketFee.toFixed(4),
        mepRate: mep.toFixed(4)
      })
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