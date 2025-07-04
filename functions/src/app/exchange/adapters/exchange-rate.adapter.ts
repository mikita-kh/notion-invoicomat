import { ExchangeRateResponse } from '../exchange.interfaces'

export abstract class ExchangeRateAdapter {
  abstract getRate(currency: string, exchangeDate: string): Promise<ExchangeRateResponse>
}
