---
title: "MemX: Local Memory for AI Tools"
description: "How Shahid Shaikh built MemX, a local-first memory layer for sharing useful context across Claude, Cursor, and other MCP clients."
date: '2026-09-21T00:00:00+05:30'
url: "/projects/memx/"
---

MemX is a local memory layer for people who use more than one AI tool. It saves useful context on your machine and makes it available to Claude, Cursor, Windsurf, and other MCP clients.

**Designed and built entirely by Shahid Shaikh.** I built the storage model, local model pipeline, semantic search, CLI, MCP server, and integrations.

[Source](https://github.com/shaikh-shahid/memx) · [Technical article](/blog/memx-local-first-ai-memory-layer/)

## Why I built it

My research often started in Claude or ChatGPT and moved to Cursor when it was time to write code. Each move meant copying notes or asking one tool to produce a large handoff prompt for another. Returning to old work had the same problem: the useful decisions were buried in a conversation.

I tried keeping markdown notes, but I was still doing all the summarising and organising myself. MemX came from wanting one small tool that could store the important parts and retrieve them from whichever AI client I happened to be using.

## Local-first architecture

MemX uses SQLite as its source of truth and `sqlite-vec` for vector search. Ollama runs the local models used for embeddings and fact extraction. Long input can be stored as a short summary plus smaller facts, so an agent can retrieve the overview and the supporting detail.

The Model Context Protocol (MCP) is the integration layer. MemX exposes tools to store, search, list, retrieve, and delete memories. Scopes, tags, and source labels keep unrelated projects separate.

There is also a CLI for working with the same store directly.

## A typical workflow

Research in Claude can be saved under a project scope with `mem_store`. Later, Cursor can call `mem_context` with that scope and receive the saved summary and facts. Both tools use the same local database; neither owns the memory.

This is the main point of MemX: the context belongs to the user, not to one chat window.

## Why these choices

- SQLite keeps setup simple and the data portable.
- `sqlite-vec` avoids running a separate vector database.
- Ollama keeps normal processing on the local machine.
- MCP avoids building a custom integration for every AI client.
- Python keeps the CLI, model pipeline, and server in one approachable codebase.

## Deliberate boundaries

MemX is a local developer tool, not a hosted production service. It does not include user authentication, rate limiting, multi-user isolation, centralised logging, or cross-device sync.

Those features would be necessary for a shared service, but they would also make this tool much heavier. MemX stays focused on one job: carrying useful context between AI tools on a developer’s machine.

[Explore MemX on GitHub](https://github.com/shaikh-shahid/memx)
