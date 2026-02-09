import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Dict, List, Optional

from .stock_model import StockModel
from stock_models.utils.sql_utils import get_db_connection


class PortfolioModel:
    def __init__(self, db_path: Optional[str] = None, conn: Optional[sqlite3.Connection] = None):
        self.db_path = db_path or os.getenv("DB_PATH", "./db/stocks.db")
        self.stock_model = StockModel()
        self._conn = conn

    @contextmanager
    def _get_connection(self):
        if self._conn is not None:
            yield self._conn
            return

        with get_db_connection(self.db_path) as conn:
            yield conn

    def buy_stock(self, symbol: str, shares: int) -> Dict:
        """Buy shares of a stock and add to portfolio."""
        if not symbol or not isinstance(symbol, str):
            raise ValueError("Invalid symbol provided")
        if not isinstance(shares, int) or shares <= 0:
            raise ValueError("Shares must be a positive integer")

        stock_info = self.stock_model.get_stock_info(symbol)
        current_price = stock_info["price"]

        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO portfolio (symbol, shares, purchase_price, purchase_date) VALUES (?, ?, ?, ?)",
                    (symbol, shares, current_price, datetime.now())
                )
                conn.commit()
        except sqlite3.Error as e:
            raise ValueError("Failed to record purchase in database") from e

        return {
            "symbol": symbol,
            "shares": shares,
            "price_per_share": current_price,
            "total_cost": current_price * shares
        }

    def sell_stock(self, symbol: str, shares: int) -> Dict:
        """Sell shares of a stock from portfolio."""
        if not symbol or not isinstance(symbol, str):
            raise ValueError("Invalid symbol provided")
        if not isinstance(shares, int) or shares <= 0:
            raise ValueError("Shares must be a positive integer")

        total_shares = self._get_total_shares(symbol)
        if total_shares < shares:
            raise ValueError(f"Not enough shares to sell. You own {total_shares} shares of {symbol}")

        stock_info = self.stock_model.get_stock_info(symbol)
        current_price = stock_info["price"]

        shares_to_remove = shares
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, shares FROM portfolio WHERE symbol = ? ORDER BY purchase_date",
                    (symbol,)
                )
                entries = cursor.fetchall()

                if not entries:
                    raise ValueError(f"No portfolio entries found for {symbol}")

                for entry_id, entry_shares in entries:
                    if shares_to_remove <= 0:
                        break

                    if entry_shares <= shares_to_remove:
                        cursor.execute("DELETE FROM portfolio WHERE id = ?", (entry_id,))
                        shares_to_remove -= entry_shares
                    else:
                        cursor.execute(
                            "UPDATE portfolio SET shares = ? WHERE id = ?",
                            (entry_shares - shares_to_remove, entry_id)
                        )
                        shares_to_remove = 0

                conn.commit()
        except sqlite3.Error as e:
            raise ValueError("Failed to record sale in database") from e

        return {
            "symbol": symbol,
            "shares_sold": shares,
            "price_per_share": current_price,
            "total_value": current_price * shares
        }

    def get_portfolio(self) -> List[Dict]:
        """Get current portfolio with latest stock prices."""
        portfolio: List[Dict] = []
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT symbol, SUM(shares) as total_shares
                    FROM portfolio
                    GROUP BY symbol
                    HAVING total_shares > 0
                """)

                holdings = cursor.fetchall()
                for symbol, shares in holdings:
                    stock_info = self.stock_model.get_stock_info(symbol)
                    current_price = stock_info["price"]

                    cursor.execute("""
                        SELECT AVG(purchase_price)
                        FROM portfolio
                        WHERE symbol = ?
                    """, (symbol,))
                    avg_purchase_price = cursor.fetchone()[0] or 0

                    portfolio.append({
                        "symbol": symbol,
                        "shares": shares,
                        "current_price": current_price,
                        "current_value": current_price * shares,
                        "avg_purchase_price": avg_purchase_price,
                        "total_gain_loss": (current_price - avg_purchase_price) * shares
                    })
        except sqlite3.Error as e:
            raise sqlite3.Error(f"Database error: {str(e)}") from e

        return portfolio

    def get_portfolio_value(self) -> Dict:
        """Calculate total portfolio value and gains/losses."""
        try:
            portfolio = self.get_portfolio()

            if not portfolio:
                return {
                    "total_value": 0.0,
                    "total_cost": 0.0,
                    "total_gain_loss": 0.0,
                    "total_gain_loss_percent": 0.0
                }

            total_value = sum(holding["current_value"] for holding in portfolio)
            total_cost = sum(holding["avg_purchase_price"] * holding["shares"] for holding in portfolio)
            total_gain_loss = sum(holding["total_gain_loss"] for holding in portfolio)

            return {
                "total_value": total_value,
                "total_cost": total_cost,
                "total_gain_loss": total_gain_loss,
                "total_gain_loss_percent": (total_gain_loss / total_cost * 100) if total_cost > 0 else 0
            }
        except ZeroDivisionError:
            return {
                "total_value": 0.0,
                "total_cost": 0.0,
                "total_gain_loss": 0.0,
                "total_gain_loss_percent": 0.0
            }
        except Exception as e:
            raise ValueError("Failed to calculate portfolio value") from e

    def _get_total_shares(self, symbol: str) -> int:
        """Get total shares owned of a particular stock."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT SUM(shares) FROM portfolio WHERE symbol = ?",
                    (symbol,)
                )
                result = cursor.fetchone()[0]
        except sqlite3.Error as e:
            raise ValueError(f"Failed to get total shares for {symbol}") from e

        return result or 0
