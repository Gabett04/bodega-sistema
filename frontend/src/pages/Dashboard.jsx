import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Users, Package, Truck, FileText, BarChart3, ShoppingCart, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ productos: 0, pedidos: 0, despachos: 0, facturas: 0, stockCritico: 0, ventasHoy: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [prod, ped, desp, fac] = await Promise.all([
          api.get('/inventario/productos'),
          api.get('/pedidos'),
          api.get('/despachos'),
          api.get('/facturas')
        ]);
        const criticos = prod.data?.filter(p => (p.stock_minimo || 0) > 0).length || 0;
        const hoy = new Date().toISOString().split('T')[0];
        const ventas = fac.data?.filter(f => f.fecha?.startsWith(hoy)).reduce((a, f) => a + (f.total || 0), 0) || 0;
        setStats({
          productos: prod.data?.length || 0,
          pedidos: ped.data?.length || 0,
          despachos: desp.data?.length || 0,
          facturas: fac.data?.length || 0,
          stockCritico: criticos,
          ventasHoy: ventas
        });
      } catch(e) {}
    };
    loadStats();
    const i = setInterval(loadStats, 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
          Bienvenido, {user?.nombre_completo}
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Panel de control - {new Date().toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs lg:text-sm">Productos</p>
              <p className="text-2xl lg:text-3xl font-bold">{stats.productos}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-blue-600 lg:size-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs lg:text-sm">Pedidos</p>
              <p className="text-2xl lg:text-3xl font-bold">{stats.pedidos}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-yellow-600 lg:size-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs lg:text-sm">Stock Crítico</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-600">{stats.stockCritico}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 lg:size-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs lg:text-sm">Ventas Hoy</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600">S/ {stats.ventasHoy.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-green-600 lg:size-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Acceso rápido + Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <h2 className="text-lg font-bold mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/inventario" className="p-3 lg:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Package size={20} className="text-blue-600 mb-1 lg:mb-2 lg:size-6" />
              <p className="font-medium text-xs lg:text-sm">Inventario</p>
            </Link>
            <Link to="/pedidos" className="p-3 lg:p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <ShoppingCart size={20} className="text-yellow-600 mb-1 lg:mb-2 lg:size-6" />
              <p className="font-medium text-xs lg:text-sm">Pedidos</p>
            </Link>
            <Link to="/despachos" className="p-3 lg:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Truck size={20} className="text-green-600 mb-1 lg:mb-2 lg:size-6" />
              <p className="font-medium text-xs lg:text-sm">Despachos</p>
            </Link>
            <Link to="/facturacion" className="p-3 lg:p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <FileText size={20} className="text-orange-600 mb-1 lg:mb-2 lg:size-6" />
              <p className="font-medium text-xs lg:text-sm">Facturación</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <h2 className="text-lg font-bold mb-4">Resumen del Día</h2>
          <div className="space-y-3 lg:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm lg:text-base">Despachos hoy</span>
              <span className="font-bold text-lg">{stats.despachos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm lg:text-base">Facturas emitidas</span>
              <span className="font-bold text-lg">{stats.facturas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm lg:text-base">Productos stock bajo</span>
              <span className="font-bold text-lg text-red-600">{stats.stockCritico}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-600 text-sm lg:text-base">Ventas del día</span>
              <span className="font-bold text-xl text-green-600">S/ {stats.ventasHoy.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;