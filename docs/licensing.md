# Licensing and third-party services

ThesisHub is a **local educational MVP**, not a licensed financial-data distribution service. This document records the current licensing status; it is not legal advice.

## ThesisHub source code

- The repository does **not** currently have a root `LICENSE` file, so no repository-wide open-source license has been expressly granted.
- The backend package is marked `"private": true` and `"license": "UNLICENSED"` to avoid an accidental ISC license declaration or npm publication. This does not replace a future repository-wide licensing decision.
- Before distributing or inviting reuse of the code, choose a license and add a root `LICENSE` file.

## Open-source dependencies

The application uses React, Vite, Express, Prisma, PostgreSQL, and other third-party packages. Each dependency is governed by **its own license**. The project does not currently maintain a consolidated dependency-license inventory. Review the exact installed package versions and their licenses before public or commercial distribution.

## Market data and charts

- **Yahoo Finance / `yahoo-finance2`:** The application obtains prices through an **unofficial integration**, not an official Yahoo Finance API agreement. Access to data does not automatically confer redistribution or commercial-use rights. Public deployment requires a suitable licensed or authorized data source and review of applicable terms.
- **TradingView embedded chart:** The frontend loads a TradingView-hosted widget on demand. Chart data and functionality are supplied by TradingView; ThesisHub does not store TradingView OHLC data. Embedding is subject to TradingView's applicable widget terms, branding/attribution requirements, and usage restrictions. Review those terms before public deployment.

## Before public deployment

Confirm data redistribution rights, TradingView embedding terms, third-party dependency licenses, and a clear license for ThesisHub's own source code. See [deployment notes](deployment.md).
