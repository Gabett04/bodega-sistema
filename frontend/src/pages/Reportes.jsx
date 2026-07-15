import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, TrendingUp, Package, DollarSign } from 'lucide-react';
import api from '../services/api';

export default function Reportes() {
  const [tipo, setTipo] = useState('inventario');
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dias, setDias] = useState(30);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      let res;
      if (tipo === 'inventario') res = await api.get('/reportes/inventario');
      else if (tipo === 'ventas') res = await api.get(`/reportes/ventas?dias=${dias}`);
      else res = await api.get('/reportes/movimientos');
      setDatos(res.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { cargarReporte(); }, [tipo, dias]);

  const exportarExcel = () => {
    if (!datos?.detalle) return;
    let csv = '';
    const keys = Object.keys(datos.detalle[0] || {});
    csv += keys.join(',') + '\n';
    datos.detalle.forEach(row => {
      csv += keys.map(k => row[k] || '').join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold"><BarChart3 size={32} className="inline text-blue-600 mr-2"/>Reportes</h1>
          <div className="flex gap-3">
            <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Dashboard</Link>
            {datos?.detalle && <button onClick={exportarExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"><Download size={16}/>Exportar CSV</button>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 flex-wrap">
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="border rounded-lg px-4 py-2">
            <option value="inventario">Inventario Valorizado</option>
            <option value="ventas">Ventas</option>
            <option value="movimientos">Movimientos</option>
          </select>
          {tipo === 'ventas' && (
            <select value={dias} onChange={e => setDias(parseInt(e.target.value))} className="border rounded-lg px-4 py-2">
              <option value={7}>7 días</option>
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
            </select>
          )}
          <button onClick={cargarReporte} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Actualizar</button>
        </div>

        {loading && <div className="text-center py-10">Cargando reporte...</div>}

        {datos && !loading && (
          <>
            {tipo === 'inventario' && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Productos</p><p className="text-2xl font-bold">{datos.total_productos}</p></div>
                <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Costo Total</p><p className="text-2xl font-bold">S/ {datos.total_costo?.toFixed(2)}</p></div>
                <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Venta Total</p><p className="text-2xl font-bold text-green-600">S/ {datos.total_venta?.toFixed(2)}</p></div>
                <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Ganancia</p><p className="text-2xl font-bold text-blue-600">S/ {datos.ganancia_potencial?.toFixed(2)}</p></div>
              </div>
            )}

            {tipo === 'ventas' && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Facturas</p><p className="text-2xl font-bold">{datos.total_facturas}</p></div>
                <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Total Ventas</p><p className="text-2xl font-bold text-green-600">S/ {datos.total_ventas?.toFixed(2)}</p></div>
                <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Período</p><p className="text-2xl font-bold">{datos.periodo}</p></div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b">
                  {datos.detalle?.length > 0 && Object.keys(datos.detalle[0]).map(k => <th key={k} className="p-3 text-left text-xs font-medium uppercase">{k.replace(/_/g,' ')}</th>)}
                </tr></thead>
                <tbody className="divide-y">
                  {datos.detalle?.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="p-3 text-sm">
                          {typeof val === 'number' ? (val % 1 !== 0 ? val.toFixed(2) : val) : (val || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}