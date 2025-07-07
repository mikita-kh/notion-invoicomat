export interface ExchangeRateResponse {
  currency: string
  no: string
  date: string
  rate: number
}

export type Currency = 'PLN' | 'EUR' | 'USD'
