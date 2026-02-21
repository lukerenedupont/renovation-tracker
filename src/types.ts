export type ItemStatus = 'needed' | 'researching' | 'ordered' | 'delivered' | 'installed'

export interface Item {
  id: string
  category: string
  name: string
  url?: string
  image?: string
  price?: number
  leadTime?: string
  status: ItemStatus
  notes?: string
}

export interface Room {
  id: string
  name: string
  color: string
  items: Item[]
}
