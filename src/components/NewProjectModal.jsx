import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { X } from 'lucide-react'

const COLORS = ['#0D9488','#2563EB','#7C3AED','#EA580C','#16A34A','#DC2626','#0891B2','#D97706']

export default function NewProjectModal({ onClose, onCreated }) {
  const [name, setName]   = useState('')
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleCreate() {
    if (!name.trim()) return setError('Project name is required')
    setSaving(true); setError('')
    const { error: err } = await supabase.from('projects')
      .insert({ name: name.trim(), tab_color: color })
    if (err) { setError(err.message); setSaving(false) }
    else { onCreated?.(); onClose() }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800">New Project</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Project name</label>
            <input
              autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="e.g. TRH-WALL FRAME"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Tab color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50">
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
