import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { useEffect, useState } from 'react'
import { LayoutDashboard, FolderOpen, Calendar, Leaf, LogOut, Plus } from 'lucide-react'
import NewProjectModal from './NewProjectModal.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [projects, setProjects] = useState([])
  const [showNew, setShowNew]   = useState(false)

  useEffect(() => {
    fetchProjects()
    const sub = supabase.channel('projects').on('postgres_changes',
      { event: '*', schema: 'public', table: 'projects' }, fetchProjects
    ).subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id,name,tab_color').order('name')
    setProjects(data || [])
  }

  async function handleLogout() { await logout(); nav('/login') }

  const link = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition'
  const active = '!bg-white/15 !text-white font-medium'

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1E3A5F] flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="text-white font-bold text-sm tracking-wide">CLASH CHECK</div>
          <div className="text-white/40 text-xs">Project Diary</div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLink to="/" end className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
            <LayoutDashboard size={16}/> Dashboard
          </NavLink>
          <NavLink to="/weekly" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
            <Calendar size={16}/> Weekly Report
          </NavLink>
          <NavLink to="/free-clash" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
            <Leaf size={16}/> Free Clash
          </NavLink>

          <div className="pt-4 pb-1">
            <div className="text-white/30 text-xs uppercase tracking-wider px-3 flex items-center justify-between">
              Projects
              <button onClick={() => setShowNew(true)} className="hover:text-white/70 transition">
                <Plus size={14}/>
              </button>
            </div>
          </div>

          {projects.map(p => (
            <NavLink key={p.id} to={`/project/${p.id}`}
              className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.tab_color || '#64748b' }}/>
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="text-white/50 text-xs px-3 mb-2 truncate">{user?.email}</div>
          <button onClick={handleLogout} className={`${link} w-full`}>
            <LogOut size={16}/> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={fetchProjects} />}
    </div>
  )
}
