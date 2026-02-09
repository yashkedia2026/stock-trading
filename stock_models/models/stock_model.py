from typing import Any, Dict
import os

import requests
from dotenv import load_dotenv

class StockModel:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
        self.base_url = 'https://www.alphavantage.co/query'

    def _request(self, params: Dict[str, str]) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY is not set")

        response = requests.get(
            self.base_url,
            params={**params, 'apikey': self.api_key},
            timeout=10
        )
        data = response.json()

        if "Error Message" in data:
            raise ValueError(data["Error Message"])
        if "Note" in data:
            raise ValueError(data["Note"])
        if "Information" in data:
            raise ValueError(data["Information"])

        return data

    def get_stock_info(self, symbol: str) -> Dict[str, Any]:
        """Get current stock information."""
        try:
            data = self._request({
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol
            })

            if "Global Quote" not in data or not data["Global Quote"]:
                raise ValueError(f"Could not fetch data for symbol {symbol}")

            quote = data["Global Quote"]
            return {
                "symbol": quote.get("01. symbol", symbol),
                "price": float(quote.get("05. price", 0)),
                "volume": int(quote.get("06. volume", 0)),
                "latest_trading_day": quote.get("07. latest trading day", ""),
                "previous_close": float(quote.get("08. previous close", 0)),
                "change": float(quote.get("09. change", 0)),
                "change_percent": quote.get("10. change percent", "0%")
            }
        except Exception as e:
            raise ValueError(f"Could not fetch data for symbol {symbol}: {e}") from e

    def get_historical_data(self, symbol: str) -> Dict[str, Any]:
        """Get historical stock data."""
        try:
            data = self._request({
                'function': 'TIME_SERIES_DAILY',
                'symbol': symbol
            })

            if "Time Series (Daily)" not in data:
                raise ValueError(f"Could not fetch historical data for symbol {symbol}")

            time_series = data["Time Series (Daily)"]
            return {date: {
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "volume": int(values["5. volume"])
            } for date, values in time_series.items()}
        except Exception as e:
            raise ValueError(f"Could not fetch historical data for symbol {symbol}: {e}") from e

    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        """Get company information."""
        try:
            data = self._request({
                'function': 'OVERVIEW',
                'symbol': symbol
            })

            if not data or "Symbol" not in data:
                raise ValueError(f"Could not fetch company info for symbol {symbol}")

            return data
        except Exception as e:
            raise ValueError(f"Could not fetch company info for symbol {symbol}: {e}") from e
