---
title: "Redistill: A Faster Redis-Compatible Database"
description: "How Shahid Shaikh built Redistill, a Redis-compatible in-memory database that reached 9.07M operations per second in published benchmarks."
date: '2026-09-21T00:00:00+05:30'
url: "/projects/redistill/"
---

Redistill is an in-memory key-value database built for cache-heavy workloads. It speaks the Redis protocol, so existing Redis clients can connect without an adapter.

**Designed and built entirely by Shahid Shaikh.** I worked on the storage engine, protocol support, persistence, security controls, packaging, documentation, and benchmarks.

[Website](https://redistill.org/) · [Source](https://github.com/redistill-io/redistill) · [Benchmarks](https://redistill.org/benchmarks.html)

## Why I built it

Redis often sits in the hottest part of a system: sessions, API caches, counters, and rate limits. Once that workload grows, a single-threaded server can become the limit.

I wanted to see what a Redis-compatible cache could do if it was designed around modern multi-core machines from the start. Redistill focuses on that use case instead of trying to copy every Redis feature.

## Architecture and engineering decisions

Redistill is written in Rust and runs on Tokio. The store is split into thousands of shards using DashMap, which reduces contention and allows unrelated keys to be handled in parallel. The network path uses pipelining, batched I/O, and low-copy buffers to keep per-command overhead down.

It supports RESP and works with clients such as `redis-cli`, redis-py, ioredis, and go-redis. Core strings, hashes, TTLs, scanning, authentication, health checks, and server statistics are included.

Persistence is optional. RDB snapshots and append-only files are available, but the fastest cache configuration keeps persistence disabled.

## Results

In the published benchmark, Redistill reached **9.07M operations per second** on one **AWS c7i.16xlarge** instance. That was 4.5× Redis and 1.7× Dragonfly in the same test. Median latency was 0.479 ms and p99 latency was 1.215 ms.

The test used `memtier_benchmark`, 160 connections, a pipeline depth of 30, 256-byte values, and an even mix of reads and writes. It ran for 60 seconds with persistence disabled for all three databases. Raw results are included in the repository.

These numbers describe that workload, not every workload. Value size, command mix, persistence, and client behavior can change the result substantially.

## Production features

Redistill includes TLS, password authentication, memory limits, eviction policies, connection controls, health endpoints, `INFO` statistics, and graceful shutdown. It can be installed through Docker, Homebrew, binaries, or source.

## When Redis remains the better fit

Use Redis when you need native replication, clustering, or the full Redis data-type surface—lists, sets, sorted sets, streams, and pub/sub. Redistill is narrower by design. Horizontal scaling currently relies on client-side sharding or a proxy.

[Try Redistill](https://redistill.org/docs/quickstart.html)
