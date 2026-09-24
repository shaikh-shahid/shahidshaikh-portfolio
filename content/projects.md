---
title: "Projects"
description: "Explore Shahid Shaikh’s projects spanning Redis-compatible infrastructure, AI memory, developer tools, data systems, and applied engineering experiments."
date: '2023-06-10T11:56:14+05:30'
---

Here are a few projects and experiments I’ve worked on. I’ll keep expanding this list over time.

## Featured projects

### [Redistill case study](/projects/redistill/)

An extremely fast Redis-compatible key-value database focused on low-latency production workloads. In the published single-instance benchmark, it reached 9.07M operations per second with 0.479 ms p50 latency.

**My role:** I designed and built the entire system, including the database engine, Redis protocol support, persistence, operational controls, packaging, documentation, and performance work.

**Why it matters:** Redis-compatible systems are often used in the hot path. Redistill demonstrates what a focused, multi-core architecture can achieve while preserving compatibility with existing Redis clients.

**Area:** Databases, distributed systems, performance engineering

[Read the case study](/projects/redistill/) · [Visit the website](https://redistill.org/) · [View the source](https://github.com/redistill-io/redistill)

### [MemX case study](/projects/memx/)

A local-first AI memory layer for engineers working across tools like Claude, Cursor, ChatGPT, and other agents.

**My role:** I designed and built the entire product, including its storage model, local AI pipeline, semantic retrieval, CLI, MCP server, and agent integrations.

**Why it matters:** AI tools lose context easily. MemX keeps summaries and atomic facts in a local SQLite store, then makes them available across agents through MCP.

**Area:** AI agents, local-first tools, developer experience

[Read the case study](/projects/memx/) · [Read the technical article](/blog/memx-local-first-ai-memory-layer/) · [View the source](https://github.com/shaikh-shahid/memx)

### [Atlas](https://github.com/shaikh-shahid/Atlas)

An open-source AI answer engine.

**Why it matters:** Answer engines are a practical way to explore retrieval, reasoning, and user-facing AI workflows without hiding the system behind a black box.

**Area:** Applied AI, search, answer generation

### [Mumbai AQI](https://github.com/shaikh-shahid/mumbaiaqi)

A community-driven air-quality tracker and recommendation platform.

**Why it matters:** Useful civic software should make local data easier to understand and act on, especially when the data affects everyday decisions.

**Area:** Data platforms, public-interest software, recommendations

## More experiments

- [Decentralised Email](https://github.com/shaikh-shahid/decentralized-email) — Peer-to-peer email platform
- [Maze Framework](https://github.com/accionlabs/Maze-Framework) — Open-source P2P app development platform
- [Carbon Credit Exchange](https://github.com/shaikh-shahid/carbon-credit-exchange) — Carbon credit exchange with blockchain verification and traceability
- [Node Token Manager](https://github.com/codeforgeek/node-refresh-token) — Node refresh token manager
- [Is Mail Valid](https://github.com/shaikh-shahid/ismailvalid/tree/main) — Email verification platform
- [Sweet LSTAT](https://github.com/shaikh-shahid/sweet-lstat) — More descriptive lstat messages
- [Payload Validator](https://www.npmjs.com/package/payload-validator) — API payload validator for Node.js
- [Corona Stats](https://www.npmjs.com/package/corona-stats) — Track COVID-19 country-level data
