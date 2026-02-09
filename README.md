# Stock Trading API

A Flask-based REST API that enables users to view stock information and manage a simulated stock portfolio. The application integrates with Alpha Vantage for real-time market data.

## Running the Application
Set `ALPHA_VANTAGE_API_KEY` in your environment or `.env` file before starting. `.env.example` lists the required variables.

Requires Python 3.10+ (Gunicorn 25+).

Build and run with Docker:

`docker build -t stock-app .`

`docker run -d -p 8000:8000 --env-file .env stock-app`

The API will be available at http://localhost:8000 and the UI at http://localhost:8000/

## Deploy on Render (Option A: Python Web Service)
1. Push this repo to GitHub and create a new **Web Service** in Render.
2. Choose **Python 3** as the language.
3. Set the **Build Command** to:
   `pip install -r requirements.lock`
4. Set the **Start Command** to:
   `bash render_start.sh`
   - This runs Gunicorn bound to `0.0.0.0:$PORT`, which is required by Render.
5. Environment variables to add in Render:
   - `ALPHA_VANTAGE_API_KEY` (required)
   - `CREATE_DB=true` (creates the DB if it doesn’t exist)
   - `RESET_DB=false` (optional safety; set `true` only if you want to wipe tables)
   - `DB_PATH=/tmp/stocks.db` for free tier (no disks)
   - `DB_PATH=/var/data/stocks.db` if you upgrade and attach a persistent disk at `/var/data`

Notes:
- Render provides the `PORT` environment variable (default 10000). The app binds to this automatically via `render_start.sh`.
- If you want SQLite data to persist, attach a **Persistent Disk** in Render and store the DB under `/var/data`.

## API Routes

### 1. Health Check
- **Path:** `/api/health`
- **Request Type:** GET
- **Purpose:** Check if the service is running properly
- **Request Format:** None
- **Response Format:**
  ```json
  {
    "status": "string"  // "healthy" when service is running
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:6000/api/health
  ```

### 2. Get Stock Information
- **Path:** `/api/stock/<symbol>`
- **Request Type:** GET
- **Purpose:** Retrieve current price and information for a stock
- **Request Format:**
  - Path Parameter: `symbol` (stock ticker e.g., AAPL)
- **Response Format:**
  ```json
  {
    "symbol": "string",
    "price": "number",
    "volume": "number",
    "change": "number",
    "change_percent": "string"
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:6000/api/stock/AAPL
  ```

### 3. Get Company Information
- **Path:** `/api/stock/<symbol>/company`
- **Request Type:** GET
- **Purpose:** Retrieve company profile information for a stock
- **Request Format:**
  - Path Parameter: `symbol` (stock ticker e.g., AAPL)
- **Response Format:** Alpha Vantage company overview payload
- **Example:**
  ```bash
  curl http://localhost:6000/api/stock/AAPL/company
  ```

### 4. Get Historical Stock Data
- **Path:** `/api/stock/<symbol>/history`
- **Request Type:** GET
- **Purpose:** Retrieve historical price data for a stock
- **Request Format:**
  - Path Parameter: `symbol` (stock ticker e.g., AAPL)
- **Response Format:**
  ```json
  {
    "YYYY-MM-DD": {
      "open": "number",
      "high": "number",
      "low": "number",
      "close": "number",
      "volume": "number"
    }
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:6000/api/stock/AAPL/history
  ```

### 5. View Portfolio
- **Path:** `/api/portfolio`
- **Request Type:** GET
- **Purpose:** Get current portfolio holdings and values
- **Request Format:** None
- **Response Format:**
  ```json
  [
    {
      "symbol": "string",
      "shares": "integer",
      "current_price": "number",
      "current_value": "number",
      "avg_purchase_price": "number",
      "total_gain_loss": "number"
    }
  ]
  ```
- **Example:**
  ```bash
  curl http://localhost:6000/api/portfolio
  ```

### 6. Portfolio Value
- **Path:** `/api/portfolio/value`
- **Request Type:** GET
- **Purpose:** Get total portfolio value and gains/losses
- **Response Format:**
  ```json
  {
    "total_value": "number",
    "total_cost": "number",
    "total_gain_loss": "number",
    "total_gain_loss_percent": "number"
  }
  ```

### 7. Buy Stock
- **Path:** `/api/portfolio/buy`
- **Request Type:** POST
- **Purpose:** Purchase shares of a stock
- **Request Format:**
  ```json
  {
    "symbol": "string",
    "shares": "integer"
  }
  ```
- **Response Format:**
  ```json
  {
    "symbol": "string",
    "shares": "integer",
    "price_per_share": "number",
    "total_cost": "number"
  }
  ```
- **Example:**
  ```bash
  curl -X POST http://localhost:6000/api/portfolio/buy \
    -H 'Content-Type: application/json' \
    -d '{"symbol": "AAPL", "shares": 10}'
  ```

### 8. Sell Stock
- **Path:** `/api/portfolio/sell`
- **Request Type:** POST
- **Purpose:** Sell shares of a stock from portfolio
- **Request Format:**
  ```json
  {
    "symbol": "string",
    "shares": "integer"
  }
  ```
- **Response Format:**
  ```json
  {
    "symbol": "string",
    "shares_sold": "integer",
    "price_per_share": "number",
    "total_value": "number"
  }
  ```
- **Example:**
  ```bash
  curl -X POST http://localhost:6000/api/portfolio/sell \
    -H 'Content-Type: application/json' \
    -d '{"symbol": "AAPL", "shares": 5}'
  ```

### 9. Create Account
- **Path:** `/api/create-account`
- **Request Type:** POST
- **Request Format:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

### 10. Login
- **Path:** `/api/login`
- **Request Type:** POST
- **Request Format:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

### 11. Update Password
- **Path:** `/api/update-password`
- **Request Type:** POST
- **Request Format:**
  ```json
  {
    "username": "string",
    "current_password": "string",
    "new_password": "string"
  }
  ```
