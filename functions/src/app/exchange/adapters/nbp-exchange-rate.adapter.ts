import { Injectable } from '@nestjs/common'
import { ExchangeRateResponse } from '../exchange.interfaces'
import { ExchangeRateAdapter } from './exchange-rate.adapter'

interface NBPExchangeRateResponse {
  rates: [{
    no: string
    effectiveDate: string
    mid: number
  }]
}

@Injectable()
export class NBPExchangeRateAdapter implements ExchangeRateAdapter {
  #apiUrl = 'http://api.nbp.pl/api/exchangerates/rates/A/'

  async getRate(currency: string, exchangeDate: string, count = 5): Promise<ExchangeRateResponse> {
    try {
      const response = await fetch(`${this.#apiUrl}/${currency}/${exchangeDate}/?format=json`)

      const data = await response.json() as NBPExchangeRateResponse

      const { rates: [rate] } = data

      return {
        currency,
        no: rate.no,
        date: rate.effectiveDate,
        rate: rate.mid,
      }
    } catch {
      if (count <= 0) {
        return {
          currency,
          no: '',
          date: exchangeDate,
          rate: 1,
        }
      }

      const prevDate = new Date(exchangeDate)
      prevDate.setDate(prevDate.getDate() - 1)
      return this.getRate(currency, prevDate.toISOString().slice(0, 10), count - 1)
    }
  }
}
