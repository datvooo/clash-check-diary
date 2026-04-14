import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { Calendar, RefreshCw } from 'lucide-react'

function getMonday(d) {
  const dt = new Date(d)
  const day = dt.getDay()
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1)
  dt.setDate(diff)
  return dt
}

function fmtDate(d) { return d.toISOString().split('T')[0] }
function displayDate(d) { return d ? new Date(d).toLocaleDateString('en-GB') : '-' }

export default function WeeklyReport() {
  const today = new Date()
  const mon   = getMonday(today)
  const sun   = new Date(mon); sun.setDate(mon.getDate() + 6)

  const [weekStart, setWeekStart] = useState(fmtDate(mon))
  const [rows, setRows]           = useState([])
  const [stats, setStats]         = useState({ pkgs:0, prog:0, done:0, clash:0, coords:0 })
  const [loading, setLoading]     = useState(false)

  useEffect(() => { load() }, [weekStart])

  async function load() {
    setLoading(true)
    const ws = new Date(weekStart)
    const we = new Date(ws); we.setDate(ws.getDate() + 6)

    const { data: pkgs } = await supabase
      .from('packages')
      .select('*, projects(name)')
      .order('actual_start')

    const inWeek = (pkgs || []).filter(p => {
      const s = p.actual_start ? new Date(p.actual_start) : null
      const f = p.actual_finish ? new Date(p.actual_finish) : null
      if (p.status === 'IN PROGRESS') return true
      if (s && s >= ws && s <= we) return true
      if (f && f >= ws && f <= we) return true
      return false
    })

    const coords = new Set(inWeek.map(p => p.coordinator || '(Unassigned)'))
    setStats({
      pkgs:  inWeek.length,
      prog:  inWeek.filter(p => p.status === 'IN PROGRESS').length,
      done:  inWeek.filter(p => p.status === 'DONE').length,
      clash: inWeek.reduce((s,p) => s+(p.str_mep||0)+(p.arc_str||0)+(p.arc_mep||0)+(p.mep_mep||0), 0),
      coords: coords.size
    })
    setRows(inWeek)
    setLoading(false)
  }

  const we = new Date(weekStart); we.setDate(we.getDate() + 6)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#1E3A5F]">Weekly Report</h1>
          <p className="text-xs text-gray-400">
            {new Date(weekStart).toLocaleDateString('en-GB')} – {we.toLocaleDateString('en-GB')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400"/>
          <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-teal-600"/>
          <button onClick={load} className="text-gray-400 hover:text-teal-600 transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Packages',     value: stats.pkgs,   color: '#2563EB' },
          { label: 'In Progress',  value: stats.prog,   color: '#EA580C' },
          { label: 'Done',         value: stats.done,   color: '#16A34A' },
          { label: 'Total Clash',  value: stats.clash,  color: '#0D9488' },
          { label: 'Coordinators', value: stats.coords, color: '#7C3AED' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1E3A5F] text-white text-xs">
              {['#','Project','Work Package','Start','Finish','Status','STR/MEP','ARC/STR','ARC/MEP','Total','Coordinator'].map(h => (
                <th key={h} className="px-3 py-2 text-center first:text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const tot = (r.str_mep||0)+(r.arc_str||0)+(r.arc_mep||0)+(r.mep_mep||0)
              const bg = i%2===0 ? 'bg-white' : 'bg-gray-50/50'
              const stClr = r.status==='DONE'?'text-green-600':r.status==='IN PROGRESS'?'text-blue-600':'text-gray-400'
              return (
                <tr key={r.id} className={`${bg} border-b border-gray-100 text-sm`}>
                  <td className="px-3 py-2 text-gray-400 text-xs">{i+1}</td>
                  <td className="px-3 py-2 text-xs font-medium text-[#1E3A5F]">{r.projects?.name}</td>
                  <td className="px-3 py-2 text-left">{r.work_package}</td>
                  <td className="px-3 py-2 text-center text-xs">{displayDate(r.actual_start)}</td>
                  <td className="px-3 py-2 text-center text-xs">{displayDate(r.actual_finish)}</td>
                  <td className={`px-3 py-2 text-center text-xs font-medium ${stClr}`}>{r.status}</td>
                  <td className="px-3 py-2 text-center">{r.str_mep||'-'}</td>
                  <td className="px-3 py-2 text-center">{r.arc_str||'-'}</td>
                  <td className="px-3 py-2 text-center">{r.arc_mep||'-'}</td>
                  <td className="px-3 py-2 text-center font-semibold text-[#0D9488]">{tot||'-'}</td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500">{r.coordinator||'—'}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-12 text-gray-400 text-sm">
                  No packages in this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
