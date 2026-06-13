# N1 Social Copy Trading

**"Follow the Best, Automatically"** — Built on N1 Chain Testnet

Live copy-trading platform where expert traders publish strategies and followers auto-execute proportional trades via N1's atomic execution (40ms bundles).

## Architecture

- **Frontend only** (Vite + React + TypeScript)
- **All data from N1 public API** — `api.n1.xyz`
- **No backend required** for testnet MVP
- **WebSocket** for live trade feed — auto-reconnects with exponential backoff

## How it works

1. Expert connects wallet → their N1 account trades appear live
2. Follower picks a trader from the leaderboard → clicks Copy
3. Expert opens a trade on N1 App → N1 atomic TX fires for all followers simultaneously
4. PnL tracked live, fee split settled on close

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## N1 API Endpoints Used

| Endpoint | Use |
|---|---|
| `GET /info` | Market & token list |
| `GET /markets/live` | Live prices for ticker |
| `GET /account/{id}` | Balances & positions |
| `GET /account/{id}/pnl/summary` | Realized + unrealized PnL |
| `GET /account/{id}/history/pnl` | Trade history for win rate |
| `GET /action/last-executed-id` | Network liveness |
| `GET /live` | Health check |
| `WSS /ws/trades@{symbol}` | Live trade feed |
| `WSS /ws/account@{id}` | Expert position changes |

## Links

- N1 App: https://app.n1.xyz
- N1 Docs: https://docs.n1.xyz
- API Docs: https://docs.n1.xyz/api
- Discord: https://discord.gg/N1Chain

## Testnet Note

All trades use test funds. No real capital at risk.
