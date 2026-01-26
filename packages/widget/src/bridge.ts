export type WidgetEventSource = 'ui' | 'agent' | 'system';

export interface WidgetEvent<T = any> {
  type: string;
  payload: T;
  requestId?: string;
  source?: WidgetEventSource;
  timestamp: number;
}

export type WidgetEventHandler<T = any> = (event: WidgetEvent<T>) => void;
export type WidgetCommandHandler<T = any> = (payload: T) => void;

export class WidgetBridge {
  private handlers = new Map<string, Set<WidgetEventHandler>>();
  private commandHandlers = new Map<string, Set<WidgetCommandHandler>>();

  emit<T>(event: WidgetEvent<T>) {
    const set = this.handlers.get(event.type);
    set?.forEach((handler) => handler(event));
  }

  on<T>(type: string, handler: WidgetEventHandler<T>) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const set = this.handlers.get(type)!;
    set.add(handler as WidgetEventHandler);

    return () => {
      const current = this.handlers.get(type);
      if (!current) {
        return;
      }
      current.delete(handler as WidgetEventHandler);
      if (current.size === 0) {
        this.handlers.delete(type);
      }
    };
  }

  command<T>(type: string, payload?: T) {
    const set = this.commandHandlers.get(type);
    set?.forEach((handler) => handler(payload as T));
  }

  onCommand<T>(type: string, handler: WidgetCommandHandler<T>) {
    if (!this.commandHandlers.has(type)) {
      this.commandHandlers.set(type, new Set());
    }
    const set = this.commandHandlers.get(type)!;
    set.add(handler as WidgetCommandHandler);

    return () => {
      const current = this.commandHandlers.get(type);
      if (!current) {
        return;
      }
      current.delete(handler as WidgetCommandHandler);
      if (current.size === 0) {
        this.commandHandlers.delete(type);
      }
    };
  }
}

export const widgetBridge = new WidgetBridge();

export const createWidgetEvent = <T>(
  type: string,
  payload: T,
  options?: {
    source?: WidgetEventSource;
    requestId?: string;
    timestamp?: number;
  }
): WidgetEvent<T> => ({
  type,
  payload,
  source: options?.source,
  requestId: options?.requestId,
  timestamp: options?.timestamp ?? Date.now(),
});
