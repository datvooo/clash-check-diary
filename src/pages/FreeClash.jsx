import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Leaf, RefreshCw } from 'lucide-react'

export default function FreeClash() {
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('packages')
      .select('*, projects(name,tab_color)')
      .or('work_package.ilike.%free clash%,work_package.ilike.%freeclash%')
      .order('project_id')
    setRows(data || [])
    setLoading(false)
  }

  const byProject = {}
  rows.forEach(r => {
    const key = r.project_id
    if (!byProject[key]) byProject[key] = { name: r.projects?.name, color: r.projects?.tab_color, pkgs: [] }
    byProject[key].pkgs.push(r)
  })

  const TH = 'px-3 py-2 text-xs font-semibold text-white text-center'
  const TD = 'px-3 py-2 text-sm text-center'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Leaf size={20} className="text-green-600"/>
          <h1 className="text-lg font-bold text-[#1E3A5F]">Free Clash Packages</h1>
          <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            {rows.length} packages
          </span>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-green-600 transition">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-12">Loading…</p>}

      {!loading && rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Leaf size={40} className="mx-auto mb-3 text-gray-200"/>
          <p>No free clash packages found.</p>
          <p className="text-xs mt-1">Name a work package containing "Free Clash" to appear here.</p>
        </div>
      )}

      {!loading && Object.values(byProject).map(proj => (
        <div key={proj.name} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: proj.color || '#64748b' }}/>
            <h2 className="font-semibold text-gray-700">{proj.name}</h2>
            <span className="text-xs text-gray-400">{proj.pkgs.length} FC pkg</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0F6E56' }}>
                  {['#','Work Package','Start','Finish','Status','Coordinator'].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proj.pkgs.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-100 ${i%2===0?'bg-white':'bg-green-50/30'}`}>
                    <td className={`${TD} text-gray-400`}>{i+1}</td>
                    <td className="px-3 py-2 text-sm font-medium text-green-700 text-left">{p.work_package}</td>
                    <td className={TD}>{p.actual_start ? new Date(p.actual_start).toLocaleDateString('en-GB') : '-'}</td>
                    <td className={TD}>{p.actual_finish ? new Date(p.actual_finish).toLocaleDateString('en-GB') : '-'}</td>
                    <td className={`${TD} font-medium ${p.status==='DONE'?'text-green-600':'text-blue-500'}`}>{p.status}</td>
                    <td className={`${TD} text-gray-500`}>{p.coordinator || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
