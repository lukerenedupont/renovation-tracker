import { useEffect, useRef, useState } from 'react'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { scrapePageMeta } from '@/lib/scrape'
import type { Item, ItemStatus } from '../types'

interface Props {
  roomName: string
  item?: Item
  onSave: (item: Item) => void
  onClose: () => void
}

const CATEGORIES = ['Toilet', 'Sink', 'Vanity', 'Tile', 'Mirror', 'Lighting', 'Towel Rod', 'Vent', 'Other']
const STATUSES: ItemStatus[] = ['needed', 'researching', 'ordered', 'delivered', 'installed']

const STATUS_ACTIVE: Record<ItemStatus, string> = {
  needed:      'bg-zinc-900 text-white border-zinc-900',
  researching: 'bg-blue-600 text-white border-blue-600',
  ordered:     'bg-amber-500 text-white border-amber-500',
  delivered:   'bg-green-600 text-white border-green-600',
  installed:   'bg-violet-600 text-white border-violet-600',
}

function faviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function ItemModal({ roomName, item, onSave, onClose }: Props) {
  const [category, setCategory] = useState(item?.category ?? '')
  const [name, setName] = useState(item?.name ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '')
  const [leadTime, setLeadTime] = useState(item?.leadTime ?? '')
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? 'needed')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [image, setImage] = useState(item?.image ?? '')
  const [imageOptions, setImageOptions] = useState<string[]>(item?.image ? [item.image] : [])
  const [imageIndex, setImageIndex] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 50)
  }, [])

  // Auto-fill from URL
  useEffect(() => {
    if (!isValidUrl(url)) return

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setFetching(true)
      setFetchError(false)
      try {
        const meta = await scrapePageMeta(url, controller.signal)
        if (meta.name) setName(meta.name)
        if (meta.price != null) setPrice(String(meta.price))
        if (meta.images.length > 0) {
          setImageOptions(meta.images)
          setImageIndex(0)
          setImage(meta.images[0])
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setFetchError(true)
      } finally {
        setFetching(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [url])

  const filteredSuggestions = CATEGORIES.filter(c =>
    c.toLowerCase().startsWith(category.toLowerCase()) && c.toLowerCase() !== category.toLowerCase()
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const parsed = parseFloat(price.replace(/[^0-9.]/g, ''))
    onSave({
      id: item?.id ?? randomId(),
      category: category.trim() || 'Other',
      name: name.trim(),
      url: url.trim() || undefined,
      image: image.trim() || undefined,
      price: isNaN(parsed) ? undefined : parsed,
      leadTime: leadTime.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    })
  }

  const favicon = faviconUrl(url)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Item' : 'Add Item'}
            <span className="text-zinc-400 font-normal ml-1.5">— {roomName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">

          {/* Image carousel */}
          {imageOptions.length > 0 && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 group/carousel">
              <img
                key={image}
                src={image}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
              />

              {/* Prev / Next — only shown when >1 image */}
              {imageOptions.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const i = (imageIndex - 1 + imageOptions.length) % imageOptions.length
                      setImageIndex(i)
                      setImage(imageOptions[i])
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-zinc-200 rounded-full p-1 shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const i = (imageIndex + 1) % imageOptions.length
                      setImageIndex(i)
                      setImage(imageOptions[i])
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-zinc-200 rounded-full p-1 shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {/* Dot counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {imageOptions.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setImageIndex(i); setImage(imageOptions[i]) }}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full transition-colors',
                          i === imageIndex ? 'bg-zinc-700' : 'bg-zinc-300 hover:bg-zinc-500'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* URL — first so paste triggers auto-fill before other fields */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              URL
              {fetching && (
                <span className="ml-2 inline-flex items-center gap-1 text-zinc-400 normal-case font-normal tracking-normal">
                  <Loader2 size={11} className="animate-spin" />
                  Auto-filling…
                </span>
              )}
              {fetchError && !fetching && (
                <span className="ml-2 text-red-400 normal-case font-normal tracking-normal">
                  Couldn't fetch page
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              {favicon && !fetching && (
                <img
                  src={favicon}
                  alt=""
                  className="w-5 h-5 rounded-sm shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              {fetching && <Loader2 size={18} className="animate-spin text-zinc-400 shrink-0" />}
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={(e) => {
                  // Use pasted value directly so effect fires immediately
                  const pasted = e.clipboardData.getData('text')
                  if (isValidUrl(pasted)) setUrl(pasted)
                }}
                placeholder="https://…  — paste to auto-fill"
                className="flex-1"
              />
            </div>
          </div>

          {/* Category */}
          <div className="relative">
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <Input
              value={category}
              onChange={(e) => { setCategory(e.target.value); setShowSuggestions(true) }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g. Toilet, Vanity…"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-md overflow-hidden">
                {filteredSuggestions.map(s => (
                  <li
                    key={s}
                    onMouseDown={() => { setCategory(s); setShowSuggestions(false) }}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 text-zinc-700"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Name / Description *
            </label>
            <Input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Toto Ultramax II"
            />
          </div>

          {/* Price + Lead Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Price ($)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="650"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                Lead Time
              </label>
              <Input
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="3–5 weeks"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors uppercase tracking-wide',
                    status === s
                      ? STATUS_ACTIVE[s]
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={fetching}>
              {item ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
