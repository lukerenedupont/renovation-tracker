import { useState } from 'react'
import type { Item, Room } from './types'
import { loadRooms, saveRooms } from './storage'
import SummaryBar from './components/SummaryBar'
import RoomSection from './components/RoomSection'
import ItemModal from './components/ItemModal'

interface ModalState {
  roomId: string
  item?: Item
}

const CARD_COLORS: Record<string, { border: string; activeBorder: string; activeBg: string; dot: string; text: string }> = {
  primary: {
    border:       'border-zinc-200',
    activeBorder: 'border-violet-400',
    activeBg:     'bg-violet-50',
    dot:          'bg-violet-500',
    text:         'text-violet-600',
  },
  main: {
    border:       'border-zinc-200',
    activeBorder: 'border-sky-400',
    activeBg:     'bg-sky-50',
    dot:          'bg-sky-500',
    text:         'text-sky-600',
  },
  small: {
    border:       'border-zinc-200',
    activeBorder: 'border-teal-400',
    activeBg:     'bg-teal-50',
    dot:          'bg-teal-500',
    text:         'text-teal-600',
  },
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>(loadRooms)
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => loadRooms()[0]?.id ?? '')
  const [modal, setModal] = useState<ModalState | null>(null)

  function updateRooms(next: Room[]) {
    setRooms(next)
    saveRooms(next)
  }

  function handleSave(item: Item) {
    if (!modal) return
    const next = rooms.map(room => {
      if (room.id !== modal.roomId) return room
      const existing = room.items.findIndex(i => i.id === item.id)
      const items = existing >= 0
        ? room.items.map(i => i.id === item.id ? item : i)
        : [...room.items, item]
      return { ...room, items }
    })
    updateRooms(next)
    setModal(null)
  }

const activeRoom = modal ? rooms.find(r => r.id === modal.roomId) : null
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? rooms[0]

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <SummaryBar rooms={rooms} />

        {/* Room selector cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {rooms.map(room => {
            const total = room.items.reduce((sum, i) => sum + (i.price ?? 0), 0)
            const pricedCount = room.items.filter(i => i.price != null).length
            const c = CARD_COLORS[room.id] ?? CARD_COLORS['primary']
            const isSelected = room.id === selectedRoomId

            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`
                  text-left rounded-2xl border-2 px-6 py-5 transition-all cursor-pointer
                  ${isSelected ? `${c.activeBorder} ${c.activeBg}` : `${c.border} bg-white hover:bg-zinc-50`}
                `}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  <span className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                    {room.name}
                  </span>
                </div>
                <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                  {pricedCount > 0 ? fmt(total) : '—'}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {room.items.length} {room.items.length === 1 ? 'item' : 'items'}
                </p>
              </button>
            )
          })}
        </div>

        {/* Selected room */}
        {selectedRoom && (
          <RoomSection
            room={selectedRoom}
            onAddItem={() => setModal({ roomId: selectedRoom.id })}
            onEditItem={(item) => setModal({ roomId: selectedRoom.id, item })}
          />
        )}
      </main>

      {modal && activeRoom && (
        <ItemModal
          roomName={activeRoom.name}
          item={modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
