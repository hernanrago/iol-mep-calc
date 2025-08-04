async function calculateMEP() {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = "Calculating...";

  try {
    const response = await fetch("/api/calculate-mep");
    const data = await response.json();

    if (data.error) {
      resultDiv.textContent = `Error: ${data.error}`;
      return;
    }

    resultDiv.innerHTML = `
      <strong>AL30D sell (with fees):</strong> ${data.al30dFinal}<br>
      <strong>AL30 buy (with fee):</strong> ${data.al30Final}<br>
      <strong>MEP rate:</strong> ${data.mep}<br>
      <strong>MEP x 100:</strong> ${data.mepX100}
    `;
  } catch (err) {
    resultDiv.textContent = `Unexpected error: ${err.message}`;
  }
}
