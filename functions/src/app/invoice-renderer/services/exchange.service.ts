import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

interface ExchangeRateResponse {
  rates: [{
    no: string
    effectiveDate: string
    mid: number
  }]
}

interface CacheEntry {
  data: ExchangeRateResponse
  timestamp: number
}

@Injectable()
export class ExchangeService implements OnModuleInit, OnModuleDestroy {
  logger = new Logger(ExchangeService.name)

  #apiUrl = 'http://api.nbp.pl/api/exchangerates/rates/A/'
  #cache = new Map<string, CacheEntry>()
  #cacheExpiryMs = 24 * 60 * 60 * 1000 // 24 hours
  #timerId: NodeJS.Timeout | null = null

  onModuleInit() {
    // Set up periodic cache cleanup every 6 hours
    this.#timerId = setInterval(() => {
      this.#cleanupCache()
    }, 6 * 60 * 60 * 1000)
  }

  onModuleDestroy() {
    if (this.#timerId) {
      clearInterval(this.#timerId)
    }
    this.#clearCache()
  }

  #isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.#cacheExpiryMs
  }

  #getFromCache(exchangeDate: string): ExchangeRateResponse | null {
    const entry = this.#cache.get(exchangeDate)

    if (entry && this.#isCacheValid(entry)) {
      return entry.data
    }

    if (entry) {
      this.#cache.delete(exchangeDate) // Remove expired entry
    }

    return null
  }

  #addToCache(exchangeDate: string, data: ExchangeRateResponse): void {
    this.#cache.set(exchangeDate, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Clear expired entries from cache
   */
  #cleanupCache(): void {
    const expiredKeys: string[] = []

    for (const [key, entry] of this.#cache.entries()) {
      if (!this.#isCacheValid(entry)) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.#cache.delete(key))
  }

  /**
   * Clear all cache entries
   */
  #clearCache(): void {
    this.#cache.clear()
  }

  async getRate(currency: string, exchangeDate: string, count = 5): Promise<ExchangeRateResponse> {
    // Check cache first
    const cachedData = this.#getFromCache(exchangeDate)

    if (cachedData) {
      return cachedData
    }

    try {
      const response = await fetch(`${this.#apiUrl}/${currency}/${exchangeDate}/?format=json`)

      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate for on ${exchangeDate}: ${response.statusText}`)
      }

      const data = await response.json() as ExchangeRateResponse

      // Cache the successful response
      this.#addToCache(exchangeDate, data)

      return data
    } catch (ex) {
      const errorMessage = ex instanceof Error ? ex.message : String(ex)
      this.logger.error(`Error fetching exchange rate for ${exchangeDate}: ${errorMessage}`)

      if (count <= 0) {
        return {
          rates: [{ mid: 1, no: '', effectiveDate: '' }],
        }
      }

      const prevDate = new Date(exchangeDate)
      prevDate.setDate(prevDate.getDate() - 1)
      return this.getRate(currency, prevDate.toISOString().slice(0, 10), count - 1)
    }
  }
}
