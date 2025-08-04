import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

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
  const url = \`https://api.invertironline.com/api/v2/bCBA/Titulos/\${ticker}/CotizacionDetalle\`;
  const response = await fetch(url, {
    headers: {
      Authorization: \`Bearer \${token}\`
    }
  });

  if (!response.ok) {
    throw new Error(\`Failed to fetch \${ticker}: \${response.statusText}\`);
  }

  return await response.json();
}

function applyFees(value, commission = 0, market = 0, operation = "add") {
  const totalFee = value * (commission + market) / 100;
  return operation === "add" ? value + totalFee : value - totalFee;
}

app.get("/api/calculate-mep", async (req, res) => {
  try {
    const token = await getToken();
    const [al30d, al30] = await Promise.all([
      fetchQuote(token, "al30d"),
      fetchQuote(token, "al30")
    ]);

    const al30dSell = al30d.puntas[0].precioVenta;
    const al30Buy = al30.puntas[0].precioCompra;

    const al30dFinal = applyFees(al30dSell, 0.49, 0.01, "add");
    const al30Final = applyFees(al30Buy, 0, 0.01, "subtract");

    const mep = al30Final / al30dFinal;

    res.json({
      al30dFinal: al30dFinal.toFixed(2),
      al30Final: al30Final.toFixed(2),
      mep: mep.toFixed(4),
      mepX100: (mep * 100).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
