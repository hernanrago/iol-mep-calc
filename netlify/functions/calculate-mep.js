import { getToken } from "js-utils/invertironline/auth.js";
import { fetchQuote } from "js-utils/invertironline/fetch-quote.js";
import bondPairs from "../../data/bond-pairs.json" assert { type: "json" };

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