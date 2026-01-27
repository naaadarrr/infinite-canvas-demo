# Widget Hook Patterns

## Goal
Define how external systems receive Widget events safely.

---

## Pattern A: Event Subscription (Recommended)

```ts
widget.on("NODE_RATED", (event) => {
  saveRating(event.payload)
})
```

### Advantages
- Decoupled
- Multi-subscriber
- Works with iframe / worker
- Replayable
- Agent-friendly

---

## Pattern B: Mount Hooks (Convenience)

```ts
mount("#app", {
  hooks: {
    onNodeRated(event) {
      saveRating(event.payload)
    }
  }
})
```

Internally this MUST still emit a domain event.

---

## Forbidden Pattern

```ts
props.onRate = fn // ❌
widget.callExternal() // ❌
```

---

## Async Feedback Pattern

Widget emits:

```ts
emit({
  type: "NODE_RATED",
  requestId: "r1",
  payload: {...}
})
```

Host responds:

```ts
widget.command("RATE_CONFIRMED", {
  requestId: "r1",
  status: "ok"
})
```

