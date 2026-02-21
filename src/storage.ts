import type { Item, Room } from './types'

const STORAGE_KEY = 'renovation-tracker-rooms'

function id(s: string) { return `ph-${s}` }
function item(i: Partial<Item> & { id: string; category: string; name: string }): Item {
  return { status: 'needed', ...i }
}

const PRIMARY_PLACEHOLDERS: Item[] = [
  item({ id: id('tub'),        category: 'Tub',          name: 'Tub' }),
  item({ id: id('toilet'),     category: 'Toilet',       name: 'Toilet' }),
  item({ id: id('vanity'),     category: 'Vanity',       name: 'Vanity' }),
  item({ id: id('mirror-1'),   category: 'Mirror',       name: 'Vanity Mirror 1' }),
  item({ id: id('mirror-2'),   category: 'Mirror',       name: 'Vanity Mirror 2' }),
  item({ id: id('faucet-1'),   category: 'Faucet',       name: 'Faucet 1' }),
  item({ id: id('faucet-2'),   category: 'Faucet',       name: 'Faucet 2' }),
  item({ id: id('tub-filler'), category: 'Tub Filler',   name: 'Tub Filler' }),
  item({ id: id('shower'),     category: 'Shower',       name: 'Slab / Tile Shower' }),
  item({ id: id('glass'),      category: 'Shower Glass', name: 'Shower Glass Enclosure' }),
  item({ id: id('vent-1'),     category: 'Vent',         name: 'Vent 1' }),
  item({ id: id('vent-2'),     category: 'Vent',         name: 'Vent 2' }),
]

const LEON_PLACEHOLDERS: Item[] = [
  item({ id: id('l-tub'),        category: 'Tub',          name: 'Drop-In Tub' }),
  item({ id: id('l-toilet'),     category: 'Toilet',       name: 'Toilet' }),
  item({ id: id('l-sink'),       category: 'Sink',         name: 'Sink' }),
  item({ id: id('l-vanity'),     category: 'Vanity',       name: 'Vanity' }),
  item({ id: id('l-mirror'),     category: 'Mirror',       name: 'Mirror' }),
  item({ id: id('l-shower'),     category: 'Shower',       name: 'Shower' }),
  item({ id: id('l-glass'),      category: 'Shower Glass', name: 'Shower Glass Enclosure' }),
  item({ id: id('l-fixtures'),   category: 'Fixtures',     name: 'Fixtures' }),
  item({ id: id('l-faucet'),     category: 'Faucet',       name: 'Faucet' }),
  item({ id: id('l-tub-filler'), category: 'Tub Filler',   name: 'Tub Filler' }),
  item({ id: id('l-shower-wand'),category: 'Showerhead',   name: 'Showerhead with Wand' }),
]

const SMALL_PLACEHOLDERS: Item[] = [
  item({ id: id('s-toilet'),  category: 'Toilet',       name: 'Toilet' }),
  item({ id: id('s-sink'),    category: 'Sink',         name: 'Sink' }),
  item({ id: id('s-vanity'),  category: 'Vanity',       name: 'Vanity' }),
  item({ id: id('s-mirror'),  category: 'Mirror',       name: 'Mirror' }),
  item({ id: id('s-shower'),  category: 'Shower',       name: 'Tile Shower' }),
  item({ id: id('s-glass'),   category: 'Shower Glass', name: 'Shower Glass Enclosure' }),
]

const DEFAULT_ROOMS: Room[] = [
  { id: 'primary', name: 'Primary Bath', color: 'bg-violet-600', items: PRIMARY_PLACEHOLDERS },
  { id: 'main',    name: "Leon's Bath",  color: 'bg-sky-600',    items: LEON_PLACEHOLDERS },
  { id: 'small',   name: 'Small Bath',   color: 'bg-teal-600',   items: SMALL_PLACEHOLDERS },
]

const ROOM_MIGRATIONS: Record<string, Partial<Room>> = {
  main: { name: "Leon's Bath" },
}

export function loadRooms(): Room[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ROOMS

    let rooms = JSON.parse(raw) as Room[]

    // Apply name migrations
    rooms = rooms.map(r => ROOM_MIGRATIONS[r.id] ? { ...r, ...ROOM_MIGRATIONS[r.id] } : r)

    // Seed placeholders into rooms that are still empty
    const seeds: Record<string, Item[]> = {
      primary: PRIMARY_PLACEHOLDERS,
      main:    LEON_PLACEHOLDERS,
      small:   SMALL_PLACEHOLDERS,
    }
    for (const room of rooms) {
      if (seeds[room.id] && room.items.length === 0) {
        room.items = seeds[room.id]
      }
    }

    saveRooms(rooms)
    return rooms
  } catch {
    return DEFAULT_ROOMS
  }
}

export function saveRooms(rooms: Room[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
}
