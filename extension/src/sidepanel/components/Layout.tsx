import { useState } from 'react'
import type { AppSettings } from '../../lib/types'
import { RecordIcon, FolderIcon, GearIcon } from './icons'
import Recording from './Recording'
import Library from './Library'
import Settings from './Settings'

type Tab = 'record' | 'library' | 'settings'

interface Props {
  settings: AppSettings
  onDisconnect: () => void
  onReprovision: () => void
}

const tabs: { id: Tab; label: string; Icon: typeof RecordIcon }[] = [
  { id: 'record', label: 'Record', Icon: RecordIcon },
  { id: 'library', label: 'Library', Icon: FolderIcon },
  { id: 'settings', label: 'Settings', Icon: GearIcon },
]

export default function Layout({ settings, onDisconnect, onReprovision }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('record')

  return (
    <div className="flex flex-col h-screen">
      <div className="stripe-divider h-[3px]" />

      <main className="flex-1 overflow-auto">
        {activeTab === 'record' && <Recording settings={settings} />}
        {activeTab === 'library' && <Library settings={settings} />}
        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onDisconnect={onDisconnect}
            onReprovision={onReprovision}
          />
        )}
      </main>

      <nav className="flex border-t border-zinc-800 bg-zinc-900">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === id
                ? 'text-[var(--crimson)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
