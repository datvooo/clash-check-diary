import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import ImportModal from '../components/ImportModal.jsx'
import { Plus, Upload, Save, Trash2, ChevronDown } from 'lucide-react'

const STATUSES = ['PENDING','IN PROGRESS','DONE','ON HOLD']
const COORDS   = ['Dat','Phuong','Tuan','TuyenTran','Vu','(Unassigned)']

const EMPTY_PKG = () => ({
  id: null, work_package:'', actual_start:'', actual_finish:'',
  status:'PENDING', str_mep:0, arc_str:0, arc_mep:0, mep_mep:0,
  coordinator:'', notes:'', _dirty: true, _new: true
})

function statusColor(s) {
  if (s === 'DONE')        return 'bg-green-100 text-green-700'
  if (s === 'IN PROGRESS') return 'bg-blue-100 text-blue-700'
  if (s === 'ON HOLD')     return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-500'
}

function CellInput({ value, onChange, type = 'text', className = '' }) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      className={`w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-teal-400 rounded ${className}`}/>
  )
}

function NumCell({ value, onChange }) {
  return (
    <input type="number" min="0" value={value || ''} onChange={e => onChange(Number(e.target.value) || 0)}
      className="w-full px-2 py-1 text-sm text-center border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-teal-400 rounded"/>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [rows, setRows]       = useState([])
  const [saving, setSaving]   = useState(false)
  const [importRow, setImportRow] = useState(null) // index for import target
  const [showImport, setShowImport] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const [{ data: proj }, { data: pkgs }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('packages').select('*').eq('project_id', id).order('row_no')
    ])
    setProject(proj)
    setRows((pkgs || []).map(p => ({ ...p, _dirty: false, _new: false })))
  }

  function updateRow(idx, field, value) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value, _dirty: true } : r))
  }

  function addRow() {
    setRows(prev => [...prev, { ...EMPTY_PKG(), row_no: prev.length + 1 }])
  }

  async function saveAll() {
    setSaving(true)
    const dirty = rows.filter(r => r._dirty)
    for (const r of dirty) {
      const payload = {
        project_id: id, row_no: r.row_no, work_package: r.work_package,
        actual_start: r.actual_start || null, actual_finish: r.actual_finish || null,
        status: r.status, str_mep: r.str_mep || 0, arc_str: r.arc_str || 0,
        arc_mep: r.arc_mep || 0, mep_mep: r.mep_mep || 0,
        coordinator: r.coordinator, notes: r.notes
      }
      if (r._new) {
        await supabase.from('packages').insert(payload)
      } else {
        await supabase.from('packages').update(payload).eq('id', r.id)
      }
    }
    setSaving(false)
    load()
  }

  async function deleteRow(idx) {
    const r = rows[idx]
    if (!r._new && r.id) await supabase.from('packages').delete().eq('id', r.id)
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  function openImport(idx) { setImportRow(idx); setShowImport(true) }

  function applyImport(result) {
    if (importRow === null) return
    // Convert DD/MM/YYYY → YYYY-MM-DD for date inputs
    function toIso(d) {
      if (!d) return ''
      const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (m) return `${m[3]}-${m[2]}-${m[1]}`
      return d
    }
    const isoDate = toIso(result.date)
    setRows(prev => prev.map((r, i) => {
      if (i !== importRow) return r
      return {
        ...r,
        work_package:  result.name || r.work_package,
        actual_start:  isoDate || r.actual_start,
        actual_finish: isoDate || r.actual_finish,
        str_mep: result.sm ?? r.str_mep,
        arc_str: result.as ?? r.arc_str,
        arc_mep: result.am ?? r.arc_mep,
        mep_mep: result.mm ?? r.mep_mep,
        _dirty: true
      }
    }))
  }

  const dirtyCount = rows.filter(r => r._dirty).length

  if (!project) return <div className="p-8 text-gray-400">Loading…</div>

  const totSM = rows.reduce((s,r) => s + (r.str_mep||0), 0)
  const totAS = rows.reduce((s,r) => s + (r.arc_str||0), 0)
  const totAM = rows.reduce((s,r) => s + (r.arc_mep||0), 0)
  const totMM = rows.reduce((s,r) => s + (r.mep_mep||0), 0)
  const done  = rows.filter(r => r.status === 'DONE').length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: project.tab_color || '#64748b' }}/>
          <h1 className="text-lg font-bold text-[#1E3A5F]">{project.name}</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {rows.length} packages · {done} done · {totSM+totAS+totAM+totMM} clashes
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            <Plus size={14}/> Add row
          </button>
          {dirtyCount > 0 && (
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-1.5 text-sm bg-[#0D9488] text-white px-4 py-1.5 rounded-lg hover:bg-[#0F766E] transition disabled:opacity-50">
              <Save size={14}/> {saving ? 'Saving…' : `Save (${dirtyCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-gray-100">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-[#1E3A5F] text-white text-xs">
              <th className="px-2 py-2 text-center w-8">#</th>
              <th className="px-3 py-2 text-left min-w-[180px]">Work Package</th>
              <th className="px-2 py-2 text-center w-28">Start</th>
              <th className="px-2 py-2 text-center w-28">Finish</th>
              <th className="px-2 py-2 text-center w-28">Status</th>
              <th className="px-2 py-2 text-center w-20 bg-orange-700/80">STR/MEP</th>
              <th className="px-2 py-2 text-center w-20 bg-orange-700/80">ARC/STR</th>
              <th className="px-2 py-2 text-center w-20 bg-orange-700/80">ARC/MEP</th>
              <th className="px-2 py-2 text-center w-20 bg-orange-700/80">MEP/MEP</th>
              <th className="px-2 py-2 text-center w-16 bg-green-700/80">Total</th>
              <th className="px-3 py-2 text-left w-28">Coordinator</th>
              <th className="px-2 py-2 text-center w-20">Import</th>
              <th className="px-2 py-2 w-8"/>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const total = (r.str_mep||0)+(r.arc_str||0)+(r.arc_mep||0)+(r.mep_mep||0)
              const bg = r._dirty ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              return (
                <tr key={r.id || i} className={`${bg} border-b border-gray-100 hover:bg-teal-50/20`}>
                  <td className="px-2 py-1.5 text-center text-xs text-gray-400">{i+1}</td>
                  <td className="px-1 py-1">
                    <CellInput value={r.work_package} onChange={v => updateRow(i,'work_package',v)}/>
                  </td>
                  <td className="px-1 py-1">
                    <CellInput type="date" value={r.actual_start} onChange={v => updateRow(i,'actual_start',v)} className="text-center"/>
                  </td>
                  <td className="px-1 py-1">
                    <CellInput type="date" value={r.actual_finish} onChange={v => updateRow(i,'actual_finish',v)} className="text-center"/>
                  </td>
                  <td className="px-1 py-1">
                    <select value={r.status || 'PENDING'} onChange={e => updateRow(i,'status',e.target.value)}
                      className={`w-full text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColor(r.status)}`}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-1 py-1"><NumCell value={r.str_mep} onChange={v => updateRow(i,'str_mep',v)}/></td>
                  <td className="px-1 py-1"><NumCell value={r.arc_str} onChange={v => updateRow(i,'arc_str',v)}/></td>
                  <td className="px-1 py-1"><NumCell value={r.arc_mep} onChange={v => updateRow(i,'arc_mep',v)}/></td>
                  <td className="px-1 py-1"><NumCell value={r.mep_mep} onChange={v => updateRow(i,'mep_mep',v)}/></td>
                  <td className="px-2 py-1 text-center text-sm font-semibold text-[#0D9488]">{total || '-'}</td>
                  <td className="px-1 py-1">
                    <select value={r.coordinator || ''} onChange={e => updateRow(i,'coordinator',e.target.value)}
                      className="w-full text-xs px-2 py-1 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-teal-400 rounded">
                      <option value="">—</option>
                      {COORDS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => openImport(i)}
                      className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 mx-auto">
                      <Upload size={12}/> xlsx
                    </button>
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button onClick={() => deleteRow(i)} className="text-gray-300 hover:text-red-500 transition">
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              )
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-12 text-gray-400 text-sm">
                  No packages yet. Click <strong>Add row</strong> to start.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-[#1E3A5F] text-white text-sm font-semibold">
                <td colSpan={5} className="px-3 py-2 text-left">TOTAL</td>
                <td className="px-2 py-2 text-center">{totSM || '-'}</td>
                <td className="px-2 py-2 text-center">{totAS || '-'}</td>
                <td className="px-2 py-2 text-center">{totAM || '-'}</td>
                <td className="px-2 py-2 text-center">{totMM || '-'}</td>
                <td className="px-2 py-2 text-center">{(totSM+totAS+totAM+totMM) || '-'}</td>
                <td colSpan={3} className="px-3 py-2 text-right text-white/60 text-xs font-normal">
                  {done}/{rows.length} done ({rows.length > 0 ? Math.round(done/rows.length*100) : 0}%)
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={applyImport}/>
      )}
    </div>
  )
}
