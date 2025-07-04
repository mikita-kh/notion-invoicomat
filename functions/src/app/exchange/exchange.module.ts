import { Module } from '@nestjs/common'
import { ExchangeRateAdapter } from './adapters/exchange-rate.adapter'
import { NBPExchangeRateAdapter } from './adapters/nbp-exchange-rate.adapter'
import { ExchangeService } from './exchange.service'

@Module({
  providers: [
    ExchangeService,
    {
      provide: ExchangeRateAdapter,
      useClass: NBPExchangeRateAdapter,
    },
  ],
  exports: [ExchangeService],
})
export class ExchangeModule {}
