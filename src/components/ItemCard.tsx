import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Item } from '../types'

interface Props {
  item: Item
  onEdit: () => void
}


function faviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export default function ItemCard({ item, onEdit }: Props) {
  return (
    <Card
      className="overflow-hidden flex flex-col border-0 shadow-sm hover:shadow-md transition-shadow duration-150 cursor-pointer group"
      onClick={onEdit}
    >
      {/* Product image */}
      {item.image && (
        <div className="relative w-full aspect-square overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
          />
        </div>
      )}

      <CardContent className="p-4 flex flex-col flex-1 gap-2">
          {/* Name */}
        <p className="font-semibold text-sm leading-snug text-zinc-900">{item.name}</p>

        {/* Price + lead time */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
          <span className="text-sm font-semibold text-zinc-900">
            {item.price != null
              ? item.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
              : '—'}
          </span>
          {item.leadTime && (
            <span className="text-xs text-zinc-400">{item.leadTime}</span>
          )}
        </div>

        {/* URL chip */}
        {item.url && (
          <div className="flex items-center gap-1.5">
            <img
              src={faviconUrl(item.url)}
              alt=""
              className="w-3.5 h-3.5 rounded-sm shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-xs text-zinc-400 truncate flex-1">{hostname(item.url)}</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-400 hover:text-zinc-600 shrink-0 transition-colors"
            >
              <ExternalLink size={11} />
            </a>
          </div>
        )}


      </CardContent>
    </Card>
  )
}
