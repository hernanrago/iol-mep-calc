async function calculateMEP() {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = "Calculating...";

  try {
    const response = await fetch("/.netlify/functions/calculate-mep");
    const data = await response.json();

    if (data.error) {
      resultDiv.textContent = `Error: ${data.error}`;
      return;
    }

    resultDiv.innerHTML = `
      <table>
        <tr>
          <td>AL30D buy price</td>
          <td>$${data.al30dBuyPrice}</td>
        </tr>
        <tr>
          <td>AL30D commission fee</td>
          <td>$${data.al30dCommissionFee}</td>
        </tr>
        <tr>
          <td>AL30D market fee</td>
          <td>$${data.al30dMarketFee}</td>
        </tr>
        <tr>
          <td>AL30 sell price</td>
          <td>$${data.al30SellPrice}</td>
        </tr>
        <tr>
          <td>AL30 market fee</td>
          <td>$${data.al30MarketFee}</td>
        </tr>
        <tr>
          <td>MEP rate</td>
          <td>$${data.mepRate}</td>
        </tr>
      </table>
    `;
  } catch (err) {
    resultDiv.textContent = `Unexpected error: ${err.message}`;
  }
}
