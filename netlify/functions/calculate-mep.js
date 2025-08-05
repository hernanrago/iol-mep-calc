import fetch from "node-fetch";

const username = process.env.IOL_USERNAME;
const password = process.env.IOL_PASSWORD;

async function getToken() {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  formData.append("grant_type", "password");

  const response = await fetch("https://api.invertironline.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate: " + response.statusText);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchQuote(token, ticker) {
  const url = `https://api.invertironline.com/api/v2/bCBA/Titulos/${ticker}/CotizacionDetalle`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${ticker}: ${response.statusText}`);
  }

  return await response.json();
}

export const handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    const token = await getToken();
    const [al30d, al30] = await Promise.all([
      fetchQuote(token, "al30d"),
      fetchQuote(token, "al30")
    ]);

    const al30dBuyPrice = al30d.puntas[0].precioCompra;
    const al30dCommissionFee = al30dBuyPrice * 0.49 / 100;
    const al30dMarketFee = al30dBuyPrice * 0.01 / 100;
    
    const al30SellPrice = al30.puntas[0].precioVenta;
    const al30MarketFee = al30SellPrice * 0.01 / 100;

    const al30dFinal = al30dBuyPrice + al30dCommissionFee + al30dMarketFee;
    const al30Final = al30SellPrice - al30MarketFee;

    const mep = al30Final / al30dFinal;

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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};