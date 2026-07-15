import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, Truck, FileText, BarChart3, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Sidebar({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin','supervisor','bodeguero','despachador','vendedor'] },
    { icon: Users, label: 'Usuarios', path: '/usuarios', roles: ['admin','supervisor'] },
    { icon: Package, label: 'Inventario', path: '/inventario', roles: ['admin','supervisor','bodeguero','despachador'] },
    { icon: ShoppingCart, label: 'Pedidos', path: '/pedidos', roles: ['admin','bodeguero','vendedor'] },
    { icon: Truck, label: 'Despachos', path: '/despachos', roles: ['admin','supervisor','despachador'] },
    { icon: FileText, label: 'Facturación', path: '/facturacion', roles: ['admin'] },
    { icon: BarChart3, label: 'Reportes', path: '/reportes', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.rol));

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Overlay móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-bold">BodegaPro</h1>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-700 rounded hidden lg:block">
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-gray-700 rounded lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredMenu.map((item, i) => {
            const active = location.pathname === item.path;
            return (
              <Link 
                key={i} 
                to={item.path} 
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                <item.icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-gray-700">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <div className="truncate">
                <p className="text-sm font-medium truncate">{user?.nombre_completo}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.rol}</p>
              </div>
            )}
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto bg-gray-100">
        {/* Header móvil */}
        <div className="lg:hidden bg-white shadow p-4 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-gray-100 rounded">
            <Menu size={24} />
          </button>
          <h1 className="font-bold text-lg">BodegaPro</h1>
          <div className="w-10"></div>
        </div>
        {children}
      </main>
    </div>
  );
}