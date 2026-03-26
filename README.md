# FiroBlocks API

NestJS REST API for [FiroBlocks](https://firoblocks.app) — a block explorer for the [Firo](https://firo.org) network. Currently provides endpoints for blocks, transactions, addresses, and network stats via direct firod RPC with MongoDB TTL caching.

## Requirements

- Node.js 24
- MongoDB 8
- A fully synced [firod](https://github.com/firoorg/firo) node with the following indexes enabled in `firo.conf`:

```
txindex=1
addressindex=1
spentindex=1
timestampindex=1
```

## Setup

```bash
cp .env.example .env
yarn --frozen
yarn dev
```

## Environment Variables

| Variable        | Description               |
| --------------- | ------------------------- |
| `PORT`          | Application Port          |
| `FIRO_RPC_HOST` | firod RPC host            |
| `FIRO_RPC_PORT` | firod RPC port            |
| `FIRO_RPC_USER` | firod RPC username        |
| `FIRO_RPC_PASS` | firod RPC password        |
| `MONGO_URI`     | MongoDB connection string |

## API Documentation

Swagger docs are available at /v1/docs when running locally, or publicly at [https://api.firoblocks.app/v1/docs](https://api.firoblocks.app/v1/docs).

## Community

- Chat: [#general:nexusocean.org](https://matrix.to/#/#general:nexusocean.org)
- Matrix client: [elements.nexusocean.org](https://elements.nexusocean.org)

## License

[Mozilla Public License 2.0](./LICENSE)
