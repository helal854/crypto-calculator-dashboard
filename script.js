document.addEventListener('DOMContentLoaded', () => {
  // Profit Calculator
  const P = document.getElementById('P'), r = document.getElementById('r'), t = document.getElementById('t');
  const P_val = document.getElementById('P_val'), r_val = document.getElementById('r_val'), t_val = document.getElementById('t_val');
  const FV = document.getElementById('FV');
  const ctxProfit = document.getElementById('profitChart').getContext('2d');
  let profitChart = new Chart(ctxProfit, { type: 'line', data: { labels: [], datasets: [{ label: 'Value', data: [] }] } });
  function updateProfit() {
    const principal = +P.value, rate = +r.value / 100, years = +t.value;
    P_val.textContent = principal; r_val.textContent = r.value; t_val.textContent = years;
    const future = principal * Math.pow(1 + rate, years);
    FV.textContent = future.toFixed(2);
    const labels = [], data = [];
    for (let i = 0; i <= years; i++) { labels.push(i); data.push((principal * Math.pow(1 + rate, i)).toFixed(2)); }
    profitChart.data.labels = labels; profitChart.data.datasets[0].data = data; profitChart.update();
  }
  [P, r, t].forEach(el => el.addEventListener('input', updateProfit));
  updateProfit();

  // Mining Calculator
  const hashrateInput = document.getElementById('hashrate'), elecCostInput = document.getElementById('elecCost'), poolFeeInput = document.getElementById('poolFee'), currencySelect = document.getElementById('currency');
  const miningResults = document.getElementById('miningResults');
  async function updateMining() {
    miningResults.innerHTML = '<p>Calculating...</p>';
    const hr = +hashrateInput.value * 1e12;
    const costPerKWh = +elecCostInput.value;
    const fee = +poolFeeInput.value / 100;
    const cur = currencySelect.value;
    const [priceRes, diffRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd').then(res => res.json()),
      fetch('https://api.blockchain.info/q/getdifficulty').then(res => res.text())
    ]);
    const btcPrice = priceRes.bitcoin.usd;
    const difficulty = +diffRes;
    const reward = 6.25;
    const secPerDay = 86400;
    const btcPerDay = (hr * secPerDay) / (difficulty * 2**32) * reward;
    const gross = cur==='usd'? btcPerDay * btcPrice : btcPerDay;
    const net = gross * (1 - fee);
    const elecCostDay = (hr/1e3) * 24 * costPerKWh;
    const profit = cur==='usd'? net - elecCostDay : net;
    miningResults.innerHTML = `
      <p>Gross ${cur.toUpperCase()}: ${gross.toFixed(6)}</p>
      <p>Net ${cur.toUpperCase()}: ${profit.toFixed(6)}</p>
      <p>Electricity Cost (24h): ${elecCostDay.toFixed(2)} USD</p>
    `;
  }
  [hashrateInput, elecCostInput, poolFeeInput, currencySelect].forEach(el => el.addEventListener('input', updateMining));
  updateMining();

  // Interactive Reports
  const loadBtn = document.getElementById('loadReport'), daysInput = document.getElementById('days'), repCurrency = document.getElementById('repCurrency');
  const ctxReport = document.getElementById('reportChart').getContext('2d');
  let reportChart;
  async function loadReport() {
    const days = +daysInput.value, cur = repCurrency.value;
    const res = await fetch(f"https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency={cur}&days={days}");
    const data = await res.json();
    const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
    const values = data.prices.map(p => p[1]);
    if (reportChart) reportChart.destroy();
    reportChart = new Chart(ctxReport, { type: 'line', data: { labels, datasets: [{ label: f"Price ({cur.toUpperCase()})", data: values }] } });
    localStorage.setItem('pref_days', days);
    localStorage.setItem('pref_currency', cur);
  }
  loadBtn.addEventListener('click', loadReport);
  const savedDays = localStorage.getItem('pref_days'), savedCur = localStorage.getItem('pref_currency');
  if (savedDays) daysInput.value = savedDays;
  if (savedCur) repCurrency.value = savedCur;
  loadReport();

  // Export PDF
  document.getElementById('exportPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('Report Export', 10, 10);
    doc.addImage(document.getElementById('reportChart').toDataURL('image/png'), 'PNG', 15, 20, 180, 80);
    doc.save('report.pdf');
  });
}