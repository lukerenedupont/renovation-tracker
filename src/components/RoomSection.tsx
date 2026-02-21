import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Item, Room } from '../types'
import ItemCard from './ItemCard'

interface Props {
  room: Room
  onAddItem: () => void
  onEditItem: (item: Item) => void
  onDeleteItem: (itemId: string) => void
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const ACCENT: Record<string, string> = {
  primary: 'text-violet-600',
  main:    'text-sky-600',
  small:   'text-teal-600',
}

const DOT: Record<string, string> = {
  primary: 'bg-violet-500',
  main:    'bg-sky-500',
  small:   'bg-teal-500',
}

export default function RoomSection({ room, onAddItem, onEditItem, onDeleteItem }: Props) {
  const total = room.items.reduce((sum, item) => sum + (item.price ?? 0), 0)
  const pricedCount = room.items.filter(i => i.price != null).length

  return (
    <section className="mb-10">
      {/* Room header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className={`w-2 h-2 rounded-full ${DOT[room.id] ?? 'bg-zinc-400'}`} />
        <h2 className="text-base font-semibold text-zinc-900">{room.name}</h2>
        <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
          {room.items.length}
        </span>
        {pricedCount > 0 && (
          <span className={`text-sm font-semibold ml-1 ${ACCENT[room.id] ?? 'text-zinc-600'}`}>
            {fmt(total)}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7 text-xs gap-1.5"
          onClick={onAddItem}
        >
          <Plus size={12} />
          Add Item
        </Button>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-100 mb-4" />

      {/* Grid or empty state */}
      {room.items.length === 0 ? (
        <div
          className="border border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400 cursor-pointer hover:border-zinc-300 hover:text-zinc-500 transition-colors"
          onClick={onAddItem}
        >
          <Plus size={20} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Add your first item for {room.name}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {room.items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => onEditItem(item)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
