# Widget Event Contract

## Purpose
This document defines the **Domain Event contract** between Widget and Host system.
Widget MUST NOT call host logic directly. It ONLY emits events.

---

## Event Envelope

```ts
export interface WidgetEvent<T = any> {
  type: string
  payload: T
  requestId?: string
  source?: "ui" | "agent" | "system"
  timestamp: number
}
```

---

## Core Principles

- Widget emits events
- Host subscribes and handles
- Widget never waits synchronously
- Host may respond via Command

---

## Example: Rating Event

```ts
{
  type: "NODE_RATED",
  payload: {
    nodeId: "node_123",
    rating: 5
  },
  source: "ui",
  timestamp: Date.now()
}
```

---

## Event Categories

### Node
- NODE_RATED
- NODE_SELECTED
- NODE_UPDATED
- NODE_DELETED
- NODE_QUICK_ACTION

### Timeline
- TIMELINE_PLAY
- TIMELINE_PAUSE

### System
- WIDGET_READY
- WIDGET_ERROR

---

## Versioning

Always version by **adding fields**, never breaking changes.

```ts
NODE_RATED:v2
```

---

## Example: Quick Action Event

```ts
{
  type: "NODE_QUICK_ACTION",
  payload: {
    nodeId: "node_456",
    nodeType: "image",
    actionId: "video",
    actionLabel: "Generate Video"
  },
  source: "ui",
  timestamp: Date.now()
}
```
