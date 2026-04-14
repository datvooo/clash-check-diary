import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { X, Upload, FileSpreadsheet } from 'lucide-react'

function pairKey(sheetName) {
  const n = sheetName.toLowerCase()
  const hasMep = n.includes('mep')
  const hasStr = n.includes('str') || n.includes('c&s')
  const hasArc = n.includes('arc')
  if (hasMep && hasStr && !hasArc) return 'STR_MEP'
  if (hasArc && hasStr && !hasMep) return 'ARC_STR'
  if (hasArc && hasMep && !hasStr) return 'ARC_MEP'
  if (hasMep && !hasStr && !hasArc) return 'MEP_MEP'
  return null
}

function parseDate(fname) {
  if (fname.length < 6) return ''
  const p = fname.substring(0, 6)
  if (!/^\d+$/.test(p)) return ''
  const yy = p.substring(0,2), mm = p.substring(2,4), dd = p.substring(4,6)
  const m = parseInt(mm), d = parseInt(dd)
  if (m < 1 || m > 12 || d < 1 || d > 31) return ''
  return `${dd}/${mm}/20${yy}`
}

async function parseXlsx(file) {
  const buf = await file.arrayBuffer()
  const wb  = XLSX.read(buf, { type: 'array' })
  let strMep=0, arcStr=0, arcMep=0, mepMep=0
  const fname = file.name.replace(/\.[^.]+$/, '')

  for (const sheetName of wb.SheetNames) {
    const pk = pairKey(sheetName)
    if (!pk) continue
    const ws   = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    let hdrRow = -1, c1 = -1
    for (let r = 0; r < Math.min(25, rows.length); r++) {
      for (let c = 0; c < (rows[r]?.length || 0); c++) {
        if (String(rows[r][c] || '').toLowerCase().includes('item1')) {
          hdrRow = r; c1 = c; break
        }
      }
      if (hdrRow >= 0) break
    }
    if (hdrRow < 0) continue

    const ids = new Set()
    for (let r = hdrRow + 1; r < rows.length; r++) {
      const cell = String(rows[r][c1] || '').trim()
      if (!cell || cell === 'nan' || cell === '0') continue
      cell.split(';').forEach(id => { const t = id.trim(); if (t) ids.add(t) })
    }

    if (pk === 'STR_MEP') strMep += ids.size
    else if (pk === 'ARC_STR') arcStr += ids.size
    else if (pk === 'ARC_MEP') arcMep += ids.size
    else if (pk === 'MEP_MEP') mepMep += ids.size
  }

  return { strMep, arcStr, arcMep, mepMep, date: parseDate(fname), name: fname }
}

export default function ImportModal({ onClose, onImport }) {
  const [files, setFiles]     = useState([])
  const [result, setResult]   = useState(null)
  const [parsing, setParsing] = useState(false)
  const inputRef = useRef()

  async function handleFiles(fileList) {
    const arr = Array.from(fileList).filter(f => /\.(xlsx|xls|xlsm)$/i.test(f.name))
    if (!arr.length) return
    setFiles(arr); setParsing(true); setResult(null)

    let sm=0, as=0, am=0, mm=0, date='', name=''
    for (const f of arr) {
      const r = await parseXlsx(f)
      sm += r.strMep; as += r.arcStr; am += r.arcMep; mm += r.mepMep
      if (!date && r.date) date = r.date
      if (!name && r.name) name = r.name
    }
    setResult({ sm, as, am, mm, date, name })
    setParsing(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  function handleApply() {
    onImport(result)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800">Import Clash Data</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600"/></button>
        </div>

        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition"
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <Upload size={32} className="mx-auto text-gray-300 mb-2"/>
          <p className="text-sm text-gray-500">Drop .xlsx files here or <span className="text-teal-600 font-medium">browse</span></p>
          <p className="text-xs text-gray-400 mt-1">Supports multiple files</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.xlsm" multiple hidden
            onChange={e => handleFiles(e.target.files)}/>
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-1">
            {files.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-xs text-gray-500">
                <FileSpreadsheet size={14} className="text-green-500"/>
                {f.name}
              </div>
            ))}
          </div>
        )}

        {parsing && <p className="text-sm text-center text-gray-400 mt-4">Parsing…</p>}

        {result && (
          <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Result</p>
            {result.date && <Row label="Date" value={result.date}/>}
            <Row label="STR vs MEP"  value={result.sm}/>
            <Row label="ARC vs STR"  value={result.as}/>
            <Row label="ARC vs MEP"  value={result.am}/>
            <Row label="MEP vs MEP"  value={result.mm}/>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-sm font-bold text-[#0D9488]">{result.sm+result.as+result.am+result.mm}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleApply} disabled={!result}
            className="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-40">
            Apply to row
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value || '-'}</span>
    </div>
  )
}
