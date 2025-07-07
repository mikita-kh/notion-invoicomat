import { DynamicModule, Module, Provider } from '@nestjs/common'
import { ExchangeRateAdapter } from './adapters/exchange-rate.adapter'
import { NBPExchangeRateAdapter } from './adapters/nbp-exchange-rate.adapter'
import { EXCHANGE_MODULE_OPTIONS } from './exchange.constants'
import { Currency } from './exchange.interfaces'
import { ExchangeService } from './exchange.service'

export interface ExchangeModuleOptions {
  baseCurrency: Currency
  adapter: 'nbp'
}

@Module({
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {
  static forFeature(options: ExchangeModuleOptions): DynamicModule {
    const providers: Provider[] = [ExchangeService]

    // Configure adapter based on options
    const adapterProvider: Provider = {
      provide: ExchangeRateAdapter,
      useClass: options.adapter === 'nbp' ? NBPExchangeRateAdapter : NBPExchangeRateAdapter,
    }

    providers.push(adapterProvider)

    providers.push({
      provide: EXCHANGE_MODULE_OPTIONS,
      useValue: options,
    })

    return {
      module: ExchangeModule,
      providers,
      exports: [ExchangeService],
    }
  }
}
