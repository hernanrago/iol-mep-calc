// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

async function calculateMEP() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = '<div class="loading">Calculating MEP for all bonds...</div>';

  try {
    const response = await fetch("/.netlify/functions/calculate-mep");
    const data = await response.json();

    if (data.error) {
      resultDiv.innerHTML = `<div class="error">Error: ${data.error}</div>`;
      return;
    }

    if (!data.bonds || data.bonds.length === 0) {
      resultDiv.innerHTML = '<div class="error">No bond data received</div>';
      return;
    }

    // Sort bonds by MEP rate (highest first)
    const sortedBonds = data.bonds.sort((a, b) => parseFloat(b.mepRate) - parseFloat(a.mepRate));

    let html = '';
    sortedBonds.forEach(bond => {
      html += `
        <div class="bond-card">
          <div class="bond-title">${bond.pair}</div>
          <div class="mep-rate">MEP Rate: $${bond.mepRate}</div>
          <table>
            <tr>
              <td>${bond.dollarBond} buy price</td>
              <td>$${bond.dollarBuyPrice}</td>
            </tr>
            <tr>
              <td>${bond.dollarBond} commission fee</td>
              <td>$${bond.dollarCommissionFee}</td>
            </tr>
            <tr>
              <td>${bond.dollarBond} market fee</td>
              <td>$${bond.dollarMarketFee}</td>
            </tr>
            <tr>
              <td>${bond.pesoBond} sell price</td>
              <td>$${bond.pesoSellPrice}</td>
            </tr>
            <tr>
              <td>${bond.pesoBond} market fee</td>
              <td>$${bond.pesoMarketFee}</td>
            </tr>
          </table>
        </div>
      `;
    });

    resultDiv.innerHTML = html;
  } catch (err) {
    resultDiv.innerHTML = `<div class="error">Unexpected error: ${err.message}</div>`;
  }
}
