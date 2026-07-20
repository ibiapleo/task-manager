'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface PillSelectProps<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  label?: string
  className?: string
}

interface MenuRect {
  top: number
  left: number
  width: number
}

export function PillSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: PillSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value)

  // The menu renders in a portal (see below) so it can never be clipped by
  // an `overflow-hidden` ancestor (e.g. the GlassCard wrapping the Users
  // list) - a z-index alone cannot fix that, only escaping the ancestor's
  // box via a portal + fixed positioning can.
  function updateMenuRect() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuRect({
      top: rect.bottom + 8,
      left: rect.right - rect.width,
      width: rect.width,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updateMenuRect()
  }, [open])

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onReposition = () => updateMenuRect()

    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, options, value])

  function commit(v: T) {
    onChange(v)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commit(options[active].value)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-full border border-border/60 bg-card/50 px-4 text-sm font-medium outline-none backdrop-blur-md transition hover:bg-card/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span>{selected?.label}</span>
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open &&
        menuRect &&
        createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={label}
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
            }}
            className="glass z-50 min-w-40 overflow-hidden rounded-2xl p-1.5"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(opt.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
                      i === active ? 'bg-primary/10' : 'hover:bg-card/60',
                    )}
                  >
                    {opt.label}
                    {isSelected && <Check className="size-4" />}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </div>
  )
}
