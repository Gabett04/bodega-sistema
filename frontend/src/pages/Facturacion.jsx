import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, EyeOff, DollarSign, Trash2 } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function Facturacion() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const [facturas, setFacturas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);

  const loadData = async () => {
    try {
      const [fac, ped] = await Promise.all([api.get('/facturas'), api.get('/pedidos')]);
      setFacturas(fac.data||[]);
      setPedidos(ped.data||[]);
    } catch(e){}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const generarFactura = async (pedidoId) => {
    try {
      await api.post(`/facturas/${pedidoId}`);
      loadData();
    } catch(err) { alert(err.response?.data?.detail||'Error'); }
  };

  const cambiarPago = async (id, estado) => {
    await api.put(`/facturas/${id}/pago?estado=${estado}`);
    loadData();
  };

  const eliminarFactura = async (id) => {
    if (!confirm('¿Eliminar esta factura?')) return;
    try {
      await api.delete(`/facturas/${id}`);
      loadData();
    } catch(err) { alert(err.response?.data?.detail||'Error al eliminar'); }
  };

  const pedidosSinFactura = pedidos.filter(p => !facturas.find(f => f.pedido_id === p.id) && p.estado !== 'cancelado');

  if(loading) return <div className="p-10 text-center text-xl">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold"><FileText size={32} className="inline text-blue-600 mr-2"/>Facturación</h1>
          <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Total Facturado</p>
            <p className="text-3xl font-bold text-blue-600">S/ {facturas.reduce((a,f) => a + (f.total||0), 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Facturas Emitidas</p>
            <p className="text-3xl font-bold text-green-600">{facturas.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Pendientes de Pago</p>
            <p className="text-3xl font-bold text-red-600">{facturas.filter(f => f.estado_pago === 'pendiente').length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-bold mb-4">Pedidos sin Factura ({pedidosSinFactura.length})</h2>
          <div className="flex flex-wrap gap-2">
            {pedidosSinFactura.map(p => (
              <button key={p.id} onClick={() => generarFactura(p.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Facturar {p.codigo} (S/ {p.total?.toFixed(2)})
              </button>
            ))}
            {pedidosSinFactura.length === 0 && <p className="text-gray-400">Todos facturados</p>}
          </div>
        </div>

        <div className="space-y-4">
          {facturas.length === 0 && <p className="text-center text-gray-500 py-10">No hay facturas</p>}
          {facturas.map(f => (
            <div key={f.id} className="bg-white rounded-lg shadow">
              <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandido(expandido===f.id?null:f.id)}>
                <div>
                  <h3 className="font-bold">{f.numero_factura}</h3>
                  <p className="text-gray-600">{f.cliente_nombre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${f.estado_pago==='pagado'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>{f.estado_pago}</span>
                  <p className="font-bold text-lg">S/ {f.total?.toFixed(2)}</p>
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); eliminarFactura(f.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar factura">
                      <Trash2 size={16} />
                    </button>
                  )}
                  {expandido===f.id ? <EyeOff size={20}/> : <Eye size={20}/>}
                </div>
              </div>
              {expandido===f.id && (
                <div className="border-t p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div><p className="text-gray-500">Subtotal</p><p className="font-medium">S/ {f.subtotal?.toFixed(2)}</p></div>
                    <div><p className="text-gray-500">IGV (18%)</p><p className="font-medium">S/ {f.igv?.toFixed(2)}</p></div>
                    <div><p className="text-gray-500">Total</p><p className="font-bold text-blue-600">S/ {f.total?.toFixed(2)}</p></div>
                  </div>
                  <table className="w-full text-sm mb-4">
                    <thead><tr className="bg-gray-50"><th className="p-2 text-left">Producto</th><th className="p-2 text-right">Cant</th><th className="p-2 text-right">P.Unit</th><th className="p-2 text-right">Subtotal</th></tr></thead>
                    <tbody>{f.detalles?.map((d,i) => <tr key={i}><td className="p-2">{d.producto_nombre}</td><td className="p-2 text-right">{d.cantidad}</td><td className="p-2 text-right">S/ {d.precio_unitario?.toFixed(2)}</td><td className="p-2 text-right">S/ {d.subtotal?.toFixed(2)}</td></tr>)}</tbody>
                  </table>
                  <select value={f.estado_pago} onChange={e => cambiarPago(f.id, e.target.value)} className="border rounded px-3 py-2">
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}