import { Inject, Injectable, Logger } from '@nestjs/common'
import { Memoize } from '../shared/decorators/memoize.decorator'
import { ExchangeRateAdapter } from './adapters/exchange-rate.adapter'
import { EXCHANGE_MODULE_OPTIONS } from './exchange.constants'
import { Currency, ExchangeRateResponse } from './exchange.interfaces'
import { ExchangeModuleOptions } from './exchange.module'

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name)

  constructor(
    private readonly exchangeRate: ExchangeRateAdapter,
    @Inject(EXCHANGE_MODULE_OPTIONS) private readonly config: ExchangeModuleOptions,
  ) {}

  @Memoize()
  async getRate(currency: Currency, exchangeDate: string): Promise<ExchangeRateResponse> {
    if (currency === this.config.baseCurrency) {
      this.logger.debug(`Using base currency: ${currency}`)
      return {
        currency,
        no: '',
        date: exchangeDate,
        rate: 1,
      }
    }

    this.logger.debug(`Fetching exchange rate for ${currency} on ${exchangeDate}`)

    try {
      const response = await this.exchangeRate.getRate(currency, exchangeDate)
      this.logger.log(`Exchange rate for ${response.currency} on ${response.date} fetched successfully`)
      return response
    } catch (error) {
      this.logger.error(`Error fetching exchange rate for ${currency} on ${exchangeDate}:`, error)
      throw error
    }
  }
}
