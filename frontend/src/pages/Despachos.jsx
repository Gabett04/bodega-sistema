import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, X, Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function Despachos() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const [despachos, setDespachos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [dForm, setDForm] = useState({ transportista:'', vehiculo_placa:'', direccion_entrega:'', observaciones:'' });

  const loadData = async () => {
    try {
      const [des, ped] = await Promise.all([api.get('/despachos'), api.get('/pedidos')]);
      setDespachos(des.data||[]);
      setPedidos(ped.data||[]);
    } catch(e){}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const pedidosPendientes = pedidos.filter(p => ['pendiente','en_preparacion','listo'].includes(p.estado) && !despachos.find(d => d.pedido_id === p.id));

  const crearDespacho = async (pedidoId) => {
    try {
      await api.post(`/despachos/${pedidoId}`, dForm);
      setShowForm(false);
      setDForm({ transportista:'', vehiculo_placa:'', direccion_entrega:'', observaciones:'' });
      loadData();
    } catch(err) { alert(err.response?.data?.detail||'Error'); }
  };

  const cambiarEstado = async (id, estado) => {
    await api.put(`/despachos/${id}/estado?estado=${estado}`);
    loadData();
  };

  const eliminarDespacho = async (id) => {
    if (!confirm('¿Eliminar este despacho? El pedido volverá a estado "listo"')) return;
    await api.delete(`/despachos/${id}`);
    loadData();
  };

  if(loading) return <div className="p-10 text-center text-xl">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold"><Truck size={32} className="inline text-blue-600 mr-2"/>Despachos</h1>
          <div className="flex gap-3">
            <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Dashboard</Link>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg"><Plus size={16} className="inline mr-1"/>Nuevo Despacho</button>
          </div>
        </div>

        <div className="space-y-4">
          {despachos.length === 0 && <p className="text-center text-gray-500 py-10">No hay despachos</p>}
          {despachos.map(d => (
            <div key={d.id} className="bg-white rounded-lg shadow">
              <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandido(expandido===d.id?null:d.id)}>
                <div>
                  <h3 className="font-bold">{d.codigo}</h3>
                  <p className="text-gray-600">{d.pedido_codigo} - {d.cliente_nombre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    d.estado==='preparado'?'bg-yellow-100 text-yellow-800':
                    d.estado==='en_transito'?'bg-blue-100 text-blue-800':
                    d.estado==='entregado'?'bg-green-100 text-green-800':'bg-gray-100'
                  }`}>{d.estado}</span>
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); eliminarDespacho(d.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  )}
                  {expandido===d.id ? <EyeOff size={20}/> : <Eye size={20}/>}
                </div>
              </div>
              {expandido===d.id && (
                <div className="border-t p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><p className="text-sm text-gray-500">Transportista</p><p className="font-medium">{d.transportista||'-'}</p></div>
                    <div><p className="text-sm text-gray-500">Placa</p><p className="font-medium">{d.vehiculo_placa||'-'}</p></div>
                    <div><p className="text-sm text-gray-500">Dirección</p><p className="font-medium">{d.direccion_entrega||'-'}</p></div>
                    <div><p className="text-sm text-gray-500">Fecha</p><p className="font-medium">{new Date(d.fecha).toLocaleString()}</p></div>
                  </div>
                  <select value={d.estado} onChange={e => cambiarEstado(d.id, e.target.value)} className="border rounded px-3 py-2">
                    <option value="preparado">Preparado</option>
                    <option value="en_transito">En tránsito</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Nuevo Despacho</h2><button onClick={() => setShowForm(false)}><X size={24}/></button></div>
              <div className="space-y-4">
                <select value={pedidoSeleccionado} onChange={e => setPedidoSeleccionado(e.target.value)} className="w-full border p-3 rounded-lg">
                  <option value="">Seleccionar pedido</option>
                  {pedidosPendientes.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.cliente_nombre}</option>)}
                </select>
                <input placeholder="Transportista" value={dForm.transportista} onChange={e => setDForm({...dForm, transportista:e.target.value})} className="w-full border p-3 rounded-lg"/>
                <input placeholder="Placa del vehículo" value={dForm.vehiculo_placa} onChange={e => setDForm({...dForm, vehiculo_placa:e.target.value})} className="w-full border p-3 rounded-lg"/>
                <input placeholder="Dirección de entrega" value={dForm.direccion_entrega} onChange={e => setDForm({...dForm, direccion_entrega:e.target.value})} className="w-full border p-3 rounded-lg"/>
                <textarea placeholder="Observaciones" value={dForm.observaciones} onChange={e => setDForm({...dForm, observaciones:e.target.value})} className="w-full border p-3 rounded-lg" rows="2"/>
                <button onClick={() => crearDespacho(pedidoSeleccionado)} disabled={!pedidoSeleccionado} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50">Crear Despacho</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}