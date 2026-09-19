import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, X, LayoutDashboard, FileText, Calendar, 
  Activity, Heart, Settings, LogOut
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t.dashboard },
    { path: "/lab", icon: FileText, label: t.labReport },
    { path: "/history", icon: Calendar, label: t.history },
    { path: "/daily-tracker", icon: Activity, label: t.dailyTracker }, 
    { path: "/hb-tracker", icon: Heart, label: t.hbTracker },
    { path: "/settings", icon: Settings, label: t.settings },
  ];

  const isActive = (path) => location.pathname === path;
  const currentPage = menuItems.find(item => isActive(item.path))?.label || t.dashboard;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay - Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 z-50 h-screen 
        bg-gradient-to-b from-slate-800 to-slate-900 
        transition-all duration-300 ease-in-out 
        flex flex-col
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}
        ${isMobile ? 'shadow-2xl' : 'shadow-lg'}
      `}>
        {/* Logo */}
        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-gradient-to-b from-slate-800 to-slate-800/95">
          <div 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <Heart size={20} className="text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight leading-tight">
                {t.appName}
              </h1>
              <p className="text-blue-300 text-[10px] tracking-wider">
                {t.appSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${active 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon size={20} className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                <span>{item.label}</span>
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-gradient-to-t from-slate-800 to-slate-800/95">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
          >
            <LogOut size={20} />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h2 className="text-lg font-semibold text-gray-800">{currentPage}</h2>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;