# Command API Specification (External → Collaborative Canvas)

## Purpose

This document defines the **Command API** used by external systems to synchronize node data
into the collaborative canvas system.

This API is **NOT a webhook** and **NOT event-based**.

External systems only express **intent**:
- create nodes
- update nodes
- delete nodes

All layout, ordering, locking, and collaboration state are managed **internally** by the canvas system.

---

## Design Principles

1. External systems do not control layout or collaboration
2. Canvas (Durable Object) is the single source of truth
3. Commands are synchronous and idempotent
4. Commands are executed sequentially inside the CanvasRoom DO
5. External systems only describe data changes, not state transitions

---

## Architecture

External System
  → HTTP POST Command API
  → Worker (auth, validate, forward)
  → Durable Object (CanvasRoom.applyCommand)
  → State update
  → Broadcast to collaborators (WebSocket)

---

## Endpoint

POST /canvas/{canvasId}/commands

Headers:
Authorization: Bearer <external-api-key>
Content-Type: application/json
X-Timestamp: <unix seconds or ms>
X-Nonce: <random string>
X-Signature: <hex hmac sha256>

---

## Command Envelope (Required)

```json
{
  "id": "cmd_20260124_0001",
  "source": "external.crm",
  "type": "upsert_nodes",
  "payload": {}
}
```

---

## Supported Commands (v1)

### append_nodes
Create only. Ignore if exists.

### upsert_nodes
Create or update by externalId + updatedAt.

### delete_nodes
Soft delete only.

---

## Node Model

```ts
interface ExternalNode {
  externalId: string
  type: string
  data: Record<string, any>
  updatedAt: number
}
```

---

## Idempotency

Commands must be deduplicated by `id`.

---

## Security (HMAC + Time Window)

The worker enforces HMAC signatures and a time window.

Canonical string:

```
v1
<HTTP_METHOD>
<PATH>
<X-Timestamp>
<X-Nonce>
<raw-body>
```

Signature:

```
hex(HMAC_SHA256(secret, canonical_string))
```

Rules:
- `X-Timestamp` must be within the time window (default 300 seconds).
- `X-Nonce` must be unique within the window.
- `X-Signature` must match the computed HMAC.

Key configuration (`EXTERNAL_API_KEYS`) supports multiple keys and optional source allowlists.

Example JSON:

```json
{
  "key_dev_1": {
    "secret": "secret_dev_1",
    "sources": ["external.crm"]
  }
}
```

Rate limiting (default 60 requests per 60 seconds) applies per key + canvas.

---

## Execution Rules

All mutations must happen inside CanvasRoom Durable Object.
Broadcast after successful apply.

---

## Non-Goals

This API will never support layout, ordering, locking, or realtime control.

---

## Agent Instructions

Follow this document strictly when generating code.
Do not extend command types.
Always enforce idempotency and validation.
