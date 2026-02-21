import type { Room } from '../types'

interface Props {
  rooms: Room[]
}

function roomTotal(room: Room): number {
  return room.items.reduce((sum, item) => sum + (item.price ?? 0), 0)
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const ROOM_DOT: Record<string, string> = {
  primary: 'bg-violet-500',
  main:    'bg-sky-500',
  small:   'bg-teal-500',
}

export default function SummaryBar({ rooms }: Props) {
  const grandTotal = rooms.reduce((sum, r) => sum + roomTotal(r), 0)
  const totalItems = rooms.reduce((sum, r) => sum + r.items.length, 0)

  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl text-zinc-900">
          Renovation Tracker
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} across {rooms.length} bathrooms
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Total</p>
        <p className="text-2xl font-semibold tracking-tight text-zinc-900">{fmt(grandTotal)}</p>
        <div className="flex items-center justify-end gap-3 mt-2">
          {rooms.map(room => {
            const total = roomTotal(room)
            return (
              <div key={room.id} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${ROOM_DOT[room.id] ?? 'bg-zinc-400'}`} />
                <span className="text-xs text-zinc-400">{room.name}</span>
                <span className="text-xs font-medium text-zinc-600">{fmt(total)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </header>
  )
}
