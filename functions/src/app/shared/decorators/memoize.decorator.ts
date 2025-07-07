const MEMOIZE_CACHE_SYMBOL = Symbol('__memoize_cache__')

interface WithCache {
  [MEMOIZE_CACHE_SYMBOL]: Map<string, { value: any, expiresAt: number }>
}

export function Memoize(ttlMs: number = 0): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (this: WithCache, ...args: any[]) {
      if (!this[MEMOIZE_CACHE_SYMBOL]) {
        Object.defineProperty(this, MEMOIZE_CACHE_SYMBOL, {
          value: new Map<string, { value: any, expiresAt: number }>(),
          writable: false,
          configurable: false,
          enumerable: false,
        })
      }

      const cache: Map<string, { value: any, expiresAt: number }> = this[MEMOIZE_CACHE_SYMBOL]

      const key = `${String(propertyKey)}:${JSON.stringify(args)}`
      const now = Date.now()

      const cached = cache.get(key)
      if (cached && (ttlMs === 0 || now < cached.expiresAt)) {
        return cached.value
      }

      const result = originalMethod.apply(this, args)

      const store = (value: any) => {
        cache.set(key, {
          value,
          expiresAt: now + ttlMs,
        })
        return value
      }

      return result instanceof Promise ? result.then(store) : store(result)
    }

    return descriptor
  }
}
