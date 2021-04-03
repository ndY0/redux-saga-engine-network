interface Socket {
  on(event: string, handler: (...args: unknown[]) => void): void;
  onAny(handler: (event: string, ...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  connect(): void;
}

interface Manager {
  on(event: string, handler: (...args: unknown[]) => void): void;
  socket(
    namespace: string,
    options: Record<string | number | symbol, unknown>
  ): Socket;
}

export { Manager, Socket };
