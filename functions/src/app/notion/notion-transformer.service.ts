import { Injectable } from '@nestjs/common'
import { PageObjectResponse } from '@notionhq/client'

type AllPagePropertyValues = PageObjectResponse['properties'][string]
type AllPagePropertyTypes = AllPagePropertyValues['type']
type HandlerPropertyTypes = 'title' | 'rich_text' | 'select' | 'multi_select' | 'status' | 'date' | 'formula' | 'rollup' | 'files' | 'relation'
type PagePropertyValue<T extends AllPagePropertyTypes = AllPagePropertyTypes> = Omit<Extract<AllPagePropertyValues, { type: T }>, 'id'>
type PrimitivePagePropertyTypes = Exclude<AllPagePropertyTypes, HandlerPropertyTypes>
type PagePrimitivePropertyValue = PagePropertyValue<PrimitivePagePropertyTypes>
type HandlerMap = {
  [K in HandlerPropertyTypes]: (value: PagePropertyValue<K>) => any
}

@Injectable()
export class NotionTransformerService {
  shouldIgnore = (_propertyName: string) => false

  transform(page: Pick<PageObjectResponse, 'id' | 'properties'>) {
    return Object.fromEntries(
      Object.entries(page.properties)
        .filter(([name]) => !this.shouldIgnore(name))
        .map(([name, value]) => [
          name.toLowerCase().replace(/\W+/g, '_'),
          this.transformPropertyValue(value),
        ]),
    )
  }

  #handlers: HandlerMap = {
    relation: value =>
      (value.relation as PageObjectResponse[]).map(relationPage => this.transform(relationPage)),

    title: value =>
      value.title.map(t => t.plain_text.trim()).filter(Boolean).join(' '),
    rich_text: value =>
      value.rich_text.map(t => t.plain_text.trim()).filter(Boolean).join(' '),

    select: value => value.select?.name ?? null,
    multi_select: value => value.multi_select.map(({ name }) => name),
    status: value => value.status?.name ?? null,

    date: value =>
      value.date?.start && value.date?.end ? value.date : value.date?.start,

    files: value =>
      value.files.map(file => file.type === 'file' ? file.file.url : file.type === 'external' ? file.external.url : null).filter(Boolean),

    formula: value => this.#handleFormula(value.formula),
    rollup: value => this.#handleRollup(value.rollup),
  }

  readonly #primitiveHandler = (value: PagePrimitivePropertyValue) => {
    const type = value.type
    return type in value ? value[type as keyof typeof value] : null
  }

  #handleFormula(formula: PagePropertyValue<'formula'>['formula']) {
    switch (formula.type) {
      case 'string': return formula.string
      case 'boolean': return formula.boolean
      default: return this.transformPropertyValue(formula)
    }
  }

  #handleRollup(rollup: PagePropertyValue<'rollup'>['rollup']) {
    if (rollup.type === 'array') {
      return rollup.array.map(rollupItem => this.transformPropertyValue(rollupItem))
    }

    return this.transformPropertyValue(rollup)
  }

  #callHandler<T extends HandlerPropertyTypes>(value: PagePropertyValue<T>): ReturnType<HandlerMap[T]> {
    const handler = this.#handlers[value.type] as (v: PagePropertyValue<T>) => ReturnType<HandlerMap[T]>
    return handler(value)
  }

  #isHandledValue(
    value: PagePropertyValue,
  ): value is PagePropertyValue<HandlerPropertyTypes> {
    return value.type in this.#handlers
  }

  #isPrimitiveValue(value: PagePropertyValue): value is PagePrimitivePropertyValue {
    return !this.#isHandledValue(value)
  }

  transformPropertyValue(value: PagePropertyValue) {
    if (this.#isHandledValue(value)) {
      return this.#callHandler(value)
    }

    if (this.#isPrimitiveValue(value)) {
      return this.#primitiveHandler(value)
    }

    return null
  }
}
