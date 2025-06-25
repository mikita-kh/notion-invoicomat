export interface InvoiceData {
  seller: Seller[]
  entries: Entry[]
  total_net: number
  status: string
  client: Client[]
  id: {
    prefix: string | null
    number: number
  }
  bank: string
  issue_date: string
  invoice_number: string
  external_id: string
  sale_date: string
  vat_amount: number
  total_gross: number
  total_pln: number
  cur: string[]
  name: string
}

export interface Seller {
  bank: BankAccount[]
  information: SellerInformation[]
  adress: Address[]
  name: string
}

export interface BankAccount {
  currency: string
  swift: string
  name: string
  account: string
  id: string
}

export interface SellerInformation {
  short_name: string
  signature: string[]
  vat_id: string
  logo: string[]
  name: string
}

export interface Address {
  country: string
  start_date: string
  postcode: string
  city: string
  street: string
  name: string
}

export interface Entry {
  quantity: number
  total_net: number
  vat_amount: number
  unit: string
  vat: string
  currency: string
  total_gross: number
  net_price: number
  name: string
}

export interface Client {
  country: string
  city: string
  tax_identification_number: string
  flag: string
  name: string
  street: string
  state: string
  postcode: string
  id: string
}
