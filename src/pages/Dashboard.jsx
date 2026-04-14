import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(n) { return n > 0 ? n : '-' }
function pct(done, total) { return total > 0 ? Math.round(done / total * 100) + '%' : '-' }

function PctBar({ value, color }) {
  const p = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${p}%`, background: color }}/>
      </div>
      <span className="text-xs font-medium w-8 text-right" style={{ color }}>{p}%</span>
    </div>
  )
}

function KPI({ label, value, bg, sub }) {
  return (
    <div className="rounded-xl p-4 flex-1 text-white" style={{ background: bg }}>
      <div className="text-xs opacity-70 font-medium tracking-wide uppercase mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {sub && <div className="text-xs opacity-50 mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [packages, setPackages] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const nav = useNavigate()
  const now = new Date()
  const curYr = now.getFullYear()
  const curMo = now.getMonth() + 1

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: pkgs }, { data: projs }] = await Promise.all([
      supabase.from('packages').select('*'),
      supabase.from('projects').select('id,name').order('name')
    ])
    setPackages(pkgs || [])
    setProjects(projs || [])
    setLoading(false)
  }

  // ── Compute KPIs ──────────────────────────────────────────────────
  const totalPkgs   = packages.length
  const totalDone   = packages.filter(p => p.status === 'DONE').length
  const totalClash  = packages.reduce((s, p) => s + (p.str_mep||0) + (p.arc_str||0) + (p.arc_mep||0) + (p.mep_mep||0), 0)

  // ── By Coordinator ────────────────────────────────────────────────
  const coordMap = {}
  packages.forEach(p => {
    const c = p.coordinator?.trim() || '(Unassigned)'
    if (!coordMap[c]) coordMap[c] = { pkg:0, done:0, sm:0, as:0, am:0, mm:0, projects: new Set() }
    const m = coordMap[c]
    m.pkg++; if (p.status === 'DONE') m.done++
    m.sm += p.str_mep||0; m.as += p.arc_str||0; m.am += p.arc_mep||0; m.mm += p.mep_mep||0
    m.projects.add(p.project_id)
  })
  const coords = Object.entries(coordMap)
    .map(([name, d]) => ({ name, ...d, projCount: d.projects.size, total: d.sm+d.as+d.am+d.mm }))
    .sort((a, b) => b.total - a.total)

  // ── By Month (current year, up to this month) ─────────────────────
  const monthMap = {}
  packages.forEach(p => {
    const raw = p.actual_start
    if (!raw) return
    const d = new Date(raw)
    if (isNaN(d)) return
    if (d.getFullYear() !== curYr) return
    const mo = d.getMonth() + 1
    if (mo > curMo) return
    const key = mo
    if (!monthMap[key]) monthMap[key] = { pkg:0, done:0, sm:0, as:0, am:0, mm:0 }
    const m = monthMap[key]
    m.pkg++; if (p.status === 'DONE') m.done++
    m.sm += p.str_mep||0; m.as += p.arc_str||0; m.am += p.arc_mep||0; m.mm += p.mep_mep||0
  })

  // ── By Project ────────────────────────────────────────────────────
  const projMap = {}
  packages.forEach(p => {
    if (!projMap[p.project_id]) projMap[p.project_id] = { pkg:0, done:0, sm:0, as:0, am:0, mm:0 }
    const m = projMap[p.project_id]
    m.pkg++; if (p.status === 'DONE') m.done++
    m.sm += p.str_mep||0; m.as += p.arc_str||0; m.am += p.arc_mep||0; m.mm += p.mep_mep||0
  })
  const projRows = projects
    .map(pr => ({ ...pr, ...(projMap[pr.id] || { pkg:0,done:0,sm:0,as:0,am:0,mm:0 }) }))
    .filter(r => r.pkg > 0)
    .map(r => ({ ...r, pctD: r.pkg > 0 ? r.done/r.pkg : 0 }))
    .sort((a, b) => a.pctD - b.pctD)

  // ── Free clash count ──────────────────────────────────────────────
  const freeClashCount = packages.filter(p =>
    p.work_package?.toLowerCase().includes('free clash') ||
    p.work_package?.toLowerCase().includes('freeclash')
  ).length

  const TH = 'px-3 py-2 text-xs font-semibold text-white text-center'
  const TD = 'px-3 py-2 text-sm text-center'

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <RefreshCw size={20} className="animate-spin mr-2"/> Loading…
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">CLASH CHECK · PROJECT DASHBOARD</h1>
          <p className="text-xs text-gray-400 mt-0.5">Last updated: {new Date().toLocaleString('vi-VN')}</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 bg-[#0D9488] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#0F766E] transition">
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-3">
        <KPI label="Projects"     value={projects.length}                     bg="#0D9488"/>
        <KPI label="Packages"     value={totalPkgs}                           bg="#2563EB"/>
        <KPI label="Clashes"      value={totalClash.toLocaleString()}         bg="#EA580C"/>
        <KPI label="Completed"    value={pct(totalDone, totalPkgs)}           bg="#16A34A"/>
        <KPI label="Coordinators" value={coords.length}                       bg="#7C3AED"/>
      </div>

      {/* BY COORDINATOR */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded bg-[#0D9488]"/>
          <h2 className="font-semibold text-[#0D9488]">BY COORDINATOR</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0D9488' }}>
                {['#','Coordinator','Projects','Packages','STR/MEP','ARC/STR','ARC/MEP','Total Clash','% Done'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coords.map((c, i) => {
                const rowPct = c.pkg > 0 ? c.done / c.pkg : 0
                const clr = rowPct >= 1 ? '#16A34A' : rowPct >= 0.8 ? '#2563EB' : rowPct >= 0.5 ? '#EA580C' : '#DC2626'
                return (
                  <tr key={c.name} className={i % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}>
                    <td className={`${TD} text-gray-400 font-medium`}>{i+1}</td>
                    <td className="px-3 py-2 text-sm font-medium text-left">
                      {i < 3 ? <span className="text-yellow-600">[#{i+1}] </span> : null}
                      {c.name}
                    </td>
                    <td className={TD}>{c.projCount}</td>
                    <td className={TD}>{c.pkg}</td>
                    <td className={TD}>{fmt(c.sm)}</td>
                    <td className={TD}>{fmt(c.as)}</td>
                    <td className={TD}>{fmt(c.am)}</td>
                    <td className={`${TD} font-semibold`}>{fmt(c.total)}</td>
                    <td className="px-3 py-2 w-28">
                      <PctBar value={rowPct} color={clr}/>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0D9488' }}>
                <td className={TH}/>
                <td className={`${TH} text-left`}>TOTAL</td>
                <td className={TH}>{projects.length}</td>
                <td className={TH}>{totalPkgs}</td>
                <td className={TH}>{fmt(coords.reduce((s,c)=>s+c.sm,0))}</td>
                <td className={TH}>{fmt(coords.reduce((s,c)=>s+c.as,0))}</td>
                <td className={TH}>{fmt(coords.reduce((s,c)=>s+c.am,0))}</td>
                <td className={TH}>{fmt(totalClash)}</td>
                <td className={TH}>{pct(totalDone, totalPkgs)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* BY MONTH */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded bg-[#7C3AED]"/>
          <h2 className="font-semibold text-[#7C3AED]">BY MONTH — Jan–{MONTH_NAMES[curMo]} {curYr}</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#7C3AED' }}>
                {['#','Month','Packages','Done','STR/MEP','ARC/STR','ARC/MEP','Total','%'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({length: curMo}, (_, i) => i + 1).map(mo => {
                const m = monthMap[mo] || { pkg:0,done:0,sm:0,as:0,am:0,mm:0 }
                const tot = m.sm+m.as+m.am+m.mm
                const isCur = mo === curMo
                const rowBg = isCur ? '#FFF7ED' : mo % 2 === 1 ? '#fff' : '#F5F3FF'
                return (
                  <tr key={mo} style={{ background: rowBg }}>
                    <td className={`${TD} text-gray-400`}>{mo}</td>
                    <td className={`px-3 py-2 text-sm font-medium text-center ${isCur ? 'text-orange-500' : m.pkg===0 ? 'text-gray-300' : 'text-gray-700'}`}>
                      {MONTH_NAMES[mo]}
                    </td>
                    <td className={TD}>{fmt(m.pkg)}</td>
                    <td className={TD}>{fmt(m.done)}</td>
                    <td className={TD}>{fmt(m.sm)}</td>
                    <td className={TD}>{fmt(m.as)}</td>
                    <td className={TD}>{fmt(m.am)}</td>
                    <td className={TD}>{fmt(tot)}</td>
                    <td className={`${TD} font-medium text-[#7C3AED]`}>{pct(m.pkg, monthMap[mo] ? m.pkg : 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* BY PROJECT */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded bg-[#EA580C]"/>
          <h2 className="font-semibold text-[#EA580C]">BY PROJECT <span className="text-gray-400 font-normal text-sm">(lagging first)</span></h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#1E3A5F' }}>
                {['#','Project','Total Pkgs','Done','STR/MEP','ARC/STR','ARC/MEP','MEP/MEP','Total','% Done'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projRows.map((p, i) => {
                const tot = p.sm+p.as+p.am+p.mm
                const clr = p.pctD >= 1 ? '#16A34A' : p.pctD >= 0.5 ? '#EA580C' : '#DC2626'
                return (
                  <tr key={p.id} className={`cursor-pointer hover:bg-orange-50 ${i%2===0?'bg-white':'bg-orange-50/30'}`}
                    onClick={() => nav(`/project/${p.id}`)}>
                    <td className={`${TD} text-gray-400`}>{i+1}</td>
                    <td className="px-3 py-2 text-sm font-medium text-left hover:underline" style={{ color: clr }}>{p.name}</td>
                    <td className={TD}>{p.pkg}</td>
                    <td className={TD}>{p.done}</td>
                    <td className={TD}>{fmt(p.sm)}</td>
                    <td className={TD}>{fmt(p.as)}</td>
                    <td className={TD}>{fmt(p.am)}</td>
                    <td className={TD}>{fmt(p.mm)}</td>
                    <td className={TD}>{fmt(tot)}</td>
                    <td className="px-3 py-2 w-24">
                      <PctBar value={p.pctD} color={clr}/>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#EA580C' }}>
                <td className={TH}/>
                <td className={`${TH} text-left`}>GRAND TOTAL</td>
                <td className={TH}>{projRows.reduce((s,r)=>s+r.pkg,0)}</td>
                <td className={TH}>{projRows.reduce((s,r)=>s+r.done,0)}</td>
                <td className={TH}>{fmt(projRows.reduce((s,r)=>s+r.sm,0))}</td>
                <td className={TH}>{fmt(projRows.reduce((s,r)=>s+r.as,0))}</td>
                <td className={TH}>{fmt(projRows.reduce((s,r)=>s+r.am,0))}</td>
                <td className={TH}>{fmt(projRows.reduce((s,r)=>s+r.mm,0))}</td>
                <td className={TH}>{fmt(totalClash)}</td>
                <td className={TH}>{pct(totalDone, totalPkgs)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Free clash note */}
      {freeClashCount > 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
          onClick={() => nav('/free-clash')} style={{ cursor: 'pointer' }}>
          <span className="text-green-700 font-medium text-sm">FREE CLASH PACKAGES</span>
          <span className="text-green-600 text-sm">{freeClashCount} packages →</span>
        </div>
      )}
    </div>
  )
}
