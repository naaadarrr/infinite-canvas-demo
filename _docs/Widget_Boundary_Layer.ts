// Widget Boundary Layer (Reference Implementation)

export type WidgetEventSource = 'ui' | 'agent' | 'system'

export interface WidgetEvent<T = any> {
  type: string
  payload: T
  requestId?: string
  source?: WidgetEventSource
  timestamp: number
}

type Handler = (event: WidgetEvent) => void
type CommandHandler = (payload: any) => void

export class WidgetBridge {
  private handlers = new Map<string, Set<Handler>>()
  private commandHandlers = new Map<string, Set<CommandHandler>>()

  emit(event: WidgetEvent) {
    const set = this.handlers.get(event.type)
    set?.forEach(h => h(event))
  }

  on(type: string, handler: Handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    return () => {
      const set = this.handlers.get(type)
      if (!set) {
        return
      }
      set.delete(handler)
      if (set.size === 0) {
        this.handlers.delete(type)
      }
    }
  }

  command(type: string, payload?: any) {
    const set = this.commandHandlers.get(type)
    set?.forEach(handler => handler(payload))
  }

  onCommand(type: string, handler: CommandHandler) {
    if (!this.commandHandlers.has(type)) {
      this.commandHandlers.set(type, new Set())
    }
    this.commandHandlers.get(type)!.add(handler)

    return () => {
      const set = this.commandHandlers.get(type)
      if (!set) {
        return
      }
      set.delete(handler)
      if (set.size === 0) {
        this.commandHandlers.delete(type)
      }
    }
  }
}

export const createWidgetEvent = <T>(
  type: string,
  payload: T,
  options?: {
    source?: WidgetEventSource
    requestId?: string
    timestamp?: number
  }
): WidgetEvent<T> => ({
  type,
  payload,
  source: options?.source,
  requestId: options?.requestId,
  timestamp: options?.timestamp ?? Date.now(),
})
