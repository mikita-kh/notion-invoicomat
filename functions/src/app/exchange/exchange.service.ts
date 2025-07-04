import { Injectable, Logger } from '@nestjs/common'
import { ExchangeRateAdapter } from './adapters/exchange-rate.adapter'
import { ExchangeRateResponse } from './exchange.interfaces'

@Injectable()
export class ExchangeService {
  #logger = new Logger(ExchangeService.name)

  constructor(private readonly exchangeRate: ExchangeRateAdapter) {}

  async getRate(currency: string, exchangeDate: string): Promise<ExchangeRateResponse> {
    this.#logger.debug(`Fetching exchange rate for ${currency} on ${exchangeDate}`)

    try {
      const response = await this.exchangeRate.getRate(currency, exchangeDate)
      this.#logger.log(`Exchange rate for ${response.currency} on ${response.date} fetched successfully`)
      return response
    } catch (error) {
      this.#logger.error(`Error fetching exchange rate for ${currency} on ${exchangeDate}:`, error)
      throw error
    }
  }
}
