const healthBtn = document.getElementById("healthBtn");
const healthIndicator = document.getElementById("healthIndicator");
const healthText = document.getElementById("healthText");

const accountResponse = document.getElementById("accountResponse");
const stockResponse = document.getElementById("stockResponse");
const portfolioResponse = document.getElementById("portfolioResponse");
const historyTable = document.getElementById("historyTable");
const portfolioTable = document.getElementById("portfolioTable");

const baseUrl = window.location.origin;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const num = Number(value);
  return Number.isFinite(num) ? currencyFormatter.format(num) : String(value);
}

function formatNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? numberFormatter.format(num) : String(value);
}

function formatPercent(value) {
  if (typeof value === "string" && value.includes("%")) {
    return value;
  }
  const num = Number(value);
  return Number.isFinite(num) ? `${num.toFixed(2)}%` : String(value);
}

function renderCard(el, { title, items = [], message, isError }) {
  const listHtml = items.length
    ? `<ul class="response-list">${items
        .map(
          (item) =>
            `<li class="response-item"><span>${item.label}</span><strong>${item.value}</strong></li>`
        )
        .join("")}</ul>`
    : "";

  const messageHtml = message ? `<p>${message}</p>` : "";

  el.innerHTML = `
    <p class="response-title">${title}</p>
    ${messageHtml}
    ${listHtml}
  `;
  el.classList.toggle("error", Boolean(isError));
}

async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  const response = await fetch(url, config);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

function buildHistoryTable(history) {
  const entries = Object.entries(history || {}).sort(
    ([a], [b]) => (a < b ? 1 : -1)
  );

  if (entries.length === 0) {
    historyTable.innerHTML = `<tr><td colspan="4">No history loaded.</td></tr>`;
    return;
  }

  historyTable.innerHTML = entries.slice(0, 10).map(([date, values]) => {
    return `
      <tr>
        <td>${date}</td>
        <td>${values.open}</td>
        <td>${values.close}</td>
        <td>${values.volume}</td>
      </tr>
    `;
  }).join("");
}

function buildPortfolioTable(holdings) {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    portfolioTable.innerHTML = `<tr><td colspan="5">No holdings loaded.</td></tr>`;
    return;
  }

  portfolioTable.innerHTML = holdings.map((item) => {
    return `
      <tr>
        <td>${item.symbol}</td>
        <td>${item.shares}</td>
        <td>${Number(item.avg_purchase_price).toFixed(2)}</td>
        <td>${Number(item.current_price).toFixed(2)}</td>
        <td>${Number(item.total_gain_loss).toFixed(2)}</td>
      </tr>
    `;
  }).join("");
}

async function checkHealth() {
  const result = await apiRequest("/api/health");
  if (result.ok && result.data.status === "healthy") {
    healthIndicator.classList.add("ok");
    healthIndicator.classList.remove("bad");
    healthText.textContent = "Healthy";
  } else {
    healthIndicator.classList.add("bad");
    healthIndicator.classList.remove("ok");
    healthText.textContent = "Unhealthy";
  }
}

document.getElementById("createAccountForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const result = await apiRequest("/api/create-account", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.ok) {
    renderCard(accountResponse, {
      title: "Account Created",
      items: [
        { label: "Username", value: result.data.username || data.username },
        { label: "User ID", value: result.data.id ?? "—" },
      ],
    });
  } else {
    renderCard(accountResponse, {
      title: "Account Error",
      message: result.data.error || "Account creation failed.",
      isError: true,
    });
  }
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const result = await apiRequest("/api/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.ok) {
    renderCard(accountResponse, {
      title: "Login Successful",
      items: [
        { label: "Username", value: result.data.username || data.username },
        { label: "User ID", value: result.data.id ?? "—" },
      ],
    });
  } else {
    renderCard(accountResponse, {
      title: "Login Error",
      message: result.data.error || "Login failed.",
      isError: true,
    });
  }
});

document.getElementById("updatePasswordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const result = await apiRequest("/api/update-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.ok) {
    renderCard(accountResponse, {
      title: "Password Updated",
      items: [{ label: "Username", value: result.data.username || data.username }],
    });
  } else {
    renderCard(accountResponse, {
      title: "Update Error",
      message: result.data.error || "Password update failed.",
      isError: true,
    });
  }
});

document.getElementById("stockInfoForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { symbol } = Object.fromEntries(new FormData(event.target).entries());
  const result = await apiRequest(`/api/stock/${symbol}`);
  if (result.ok) {
    renderCard(stockResponse, {
      title: `Quote: ${result.data.symbol}`,
      items: [
        { label: "Price", value: formatCurrency(result.data.price) },
        { label: "Change", value: formatCurrency(result.data.change) },
        { label: "Change %", value: formatPercent(result.data.change_percent) },
        { label: "Prev Close", value: formatCurrency(result.data.previous_close) },
        { label: "Latest Day", value: result.data.latest_trading_day || "—" },
        { label: "Volume", value: formatNumber(result.data.volume) },
      ],
    });
  } else {
    renderCard(stockResponse, {
      title: `Quote Error (${symbol})`,
      message: result.data.error || "Unable to load quote.",
      isError: true,
    });
  }
});

document.getElementById("companyInfoForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { symbol } = Object.fromEntries(new FormData(event.target).entries());
  const result = await apiRequest(`/api/stock/${symbol}/company`);
  if (result.ok) {
    renderCard(stockResponse, {
      title: result.data.Name ? `${result.data.Name} (${result.data.Symbol})` : `Company: ${symbol}`,
      items: [
        { label: "Sector", value: result.data.Sector || "—" },
        { label: "Industry", value: result.data.Industry || "—" },
        { label: "Country", value: result.data.Country || "—" },
        { label: "Exchange", value: result.data.Exchange || "—" },
        { label: "Market Cap", value: formatNumber(result.data.MarketCapitalization || "—") },
        { label: "PE Ratio", value: result.data.PERatio || "—" },
      ],
      message: result.data.Description ? result.data.Description.slice(0, 160) + "…" : "",
    });
  } else {
    renderCard(stockResponse, {
      title: `Company Info Error (${symbol})`,
      message: result.data.error || "Unable to load company info.",
      isError: true,
    });
  }
});

document.getElementById("historyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { symbol } = Object.fromEntries(new FormData(event.target).entries());
  const result = await apiRequest(`/api/stock/${symbol}/history`);
  if (result.ok) {
    buildHistoryTable(result.data);
    renderCard(stockResponse, {
      title: `History Loaded (${symbol})`,
      message: "Showing the 10 most recent trading days.",
    });
  } else {
    renderCard(stockResponse, {
      title: `History Error (${symbol})`,
      message: result.data.error || "Unable to load history.",
      isError: true,
    });
  }
});

document.getElementById("buyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  data.shares = Number(data.shares);
  const result = await apiRequest("/api/portfolio/buy", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.ok) {
    renderCard(portfolioResponse, {
      title: "Purchase Complete",
      items: [
        { label: "Symbol", value: result.data.symbol },
        { label: "Shares", value: result.data.shares },
        { label: "Price/Share", value: formatCurrency(result.data.price_per_share) },
        { label: "Total Cost", value: formatCurrency(result.data.total_cost) },
      ],
    });
  } else {
    renderCard(portfolioResponse, {
      title: "Buy Error",
      message: result.data.error || "Unable to place buy order.",
      isError: true,
    });
  }
});

document.getElementById("sellForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  data.shares = Number(data.shares);
  const result = await apiRequest("/api/portfolio/sell", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.ok) {
    renderCard(portfolioResponse, {
      title: "Sale Complete",
      items: [
        { label: "Symbol", value: result.data.symbol },
        { label: "Shares Sold", value: result.data.shares_sold },
        { label: "Price/Share", value: formatCurrency(result.data.price_per_share) },
        { label: "Total Value", value: formatCurrency(result.data.total_value) },
      ],
    });
  } else {
    renderCard(portfolioResponse, {
      title: "Sell Error",
      message: result.data.error || "Unable to place sell order.",
      isError: true,
    });
  }
});

document.getElementById("portfolioBtn").addEventListener("click", async () => {
  const result = await apiRequest("/api/portfolio");
  if (result.ok) {
    buildPortfolioTable(result.data);
    renderCard(portfolioResponse, {
      title: "Holdings Loaded",
      message: `Found ${result.data.length} holdings.`,
    });
  } else {
    renderCard(portfolioResponse, {
      title: "Holdings Error",
      message: result.data.error || "Unable to load holdings.",
      isError: true,
    });
  }
});

document.getElementById("portfolioValueBtn").addEventListener("click", async () => {
  const result = await apiRequest("/api/portfolio/value");
  if (result.ok) {
    renderCard(portfolioResponse, {
      title: "Portfolio Value",
      items: [
        { label: "Total Value", value: formatCurrency(result.data.total_value) },
        { label: "Total Cost", value: formatCurrency(result.data.total_cost) },
        { label: "Gain/Loss", value: formatCurrency(result.data.total_gain_loss) },
        { label: "Gain/Loss %", value: formatPercent(result.data.total_gain_loss_percent) },
      ],
    });
  } else {
    renderCard(portfolioResponse, {
      title: "Value Error",
      message: result.data.error || "Unable to load portfolio value.",
      isError: true,
    });
  }
});

healthBtn.addEventListener("click", checkHealth);

checkHealth();
