import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, X, ShoppingCart, Users, Edit, Eye, EyeOff, Search } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function Pedidos() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pedidos');
  const [showPedido, setShowPedido] = useState(false);
  const [showCliente, setShowCliente] = useState(false);
  const [pedidoExpandido, setPedidoExpandido] = useState(null);
  const [editandoPedido, setEditandoPedido] = useState(null);
  const [editandoCliente, setEditandoCliente] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [busquedaClientePedido, setBusquedaClientePedido] = useState('');
  const [busquedaProductoPedido, setBusquedaProductoPedido] = useState('');
  const [cForm, setCForm] = useState({ codigo: '', nombre: '', telefono: '', direccion: '' });
  const [pForm, setPForm] = useState({ codigo: '', cliente_id: '', notas: '', detalles: [] });
  const [detalleActual, setDetalleActual] = useState({ producto_id: '', cantidad: '', precio_unitario: '' });

  const loadData = async () => {
    try {
      const [ped, cli, prod] = await Promise.all([
        api.get('/pedidos'),
        api.get('/pedidos/clientes'),
        api.get('/inventario/productos')
      ]);
      setPedidos(ped.data || []);
      setClientes(cli.data || []);
      setProductos(prod.data || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  
  // Actualización automática cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => { loadData(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveCliente = async (e) => {
    e.preventDefault();
    try {
      const d = { ...cForm };
      if (!d.codigo) delete d.codigo;
      if (editandoCliente) {
        await api.put(`/pedidos/clientes/${editandoCliente}`, d);
      } else {
        await api.post('/pedidos/clientes', d);
      }
      setShowCliente(false);
      setEditandoCliente(null);
      setCForm({ codigo: '', nombre: '', telefono: '', direccion: '' });
      loadData();
    } catch(err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const editarCliente = (c) => {
    setEditandoCliente(c.id);
    setCForm({ codigo: c.codigo, nombre: c.nombre, telefono: c.telefono || '', direccion: c.direccion || '' });
    setShowCliente(true);
  };

  const eliminarCliente = async (id) => {
    if (!confirm('¿Eliminar este cliente y todos sus pedidos?')) return;
    await api.delete(`/pedidos/clientes/${id}`);
    loadData();
  };

  const addDetalle = () => {
    if (!detalleActual.producto_id || !detalleActual.cantidad) return;
    setPForm({
      ...pForm,
      detalles: [...pForm.detalles, {
        producto_id: parseInt(detalleActual.producto_id),
        cantidad: parseFloat(detalleActual.cantidad),
        precio_unitario: detalleActual.precio_unitario ? parseFloat(detalleActual.precio_unitario) : null
      }]
    });
    setDetalleActual({ producto_id: '', cantidad: '', precio_unitario: '' });
  };

  const removeDetalle = (i) => setPForm({ ...pForm, detalles: pForm.detalles.filter((_, idx) => idx !== i) });

  const savePedido = async (e) => {
    e.preventDefault();
    if (pForm.detalles.length === 0) { alert('Agrega productos'); return; }
    if (!pForm.cliente_id) { alert('Selecciona un cliente'); return; }
    try {
      const d = { cliente_id: parseInt(pForm.cliente_id), notas: pForm.notas || '', detalles: pForm.detalles };
      if (pForm.codigo && pForm.codigo.trim()) d.codigo = pForm.codigo.trim();
      if (editandoPedido) {
        await api.put(`/pedidos/${editandoPedido}`, d);
      } else {
        await api.post('/pedidos', d);
      }
      setShowPedido(false);
      setEditandoPedido(null);
      setPForm({ codigo: '', cliente_id: '', notas: '', detalles: [] });
      loadData();
    } catch(err) { alert(err.response?.data?.detail || 'Error al crear pedido'); }
  };

  const editarPedido = (p) => {
    setEditandoPedido(p.id);
    setPForm({
      codigo: p.codigo, cliente_id: p.cliente_id, notas: p.notas || '',
      detalles: p.detalles?.map(d => ({ producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.precio_unitario })) || []
    });
    setShowPedido(true);
  };

  const eliminarPedido = async (id) => {
    if (!confirm('¿Eliminar este pedido?')) return;
    await api.delete(`/pedidos/${id}`);
    loadData();
  };

  const cambiarEstado = async (id, estado) => {
    await api.put(`/pedidos/${id}/estado?estado=${estado}`);
    loadData();
  };

  const getProdNombre = (id) => productos.find(p => p.id === id)?.nombre || 'Producto #' + id;

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroCliente && p.cliente_id !== parseInt(filtroCliente)) return false;
    if (filtroEstado && p.estado !== filtroEstado) return false;
    return true;
  });

  const clientesFiltrados = busquedaCliente
    ? clientes.filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || c.codigo.toLowerCase().includes(busquedaCliente.toLowerCase()))
    : clientes;

  if (loading) return <div className="p-10 text-center text-xl">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold"><ShoppingCart size={32} className="inline text-blue-600 mr-2" />Pedidos y Clientes</h1>
          <div className="flex gap-3">
            <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg">← Dashboard</Link>
            <button onClick={() => { setEditandoCliente(null); setCForm({ codigo: '', nombre: '', telefono: '', direccion: '' }); setShowCliente(true); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg"><Users size={16} className="inline mr-1" />Cliente</button>
            <button onClick={() => { setEditandoPedido(null); setPForm({ codigo: '', cliente_id: '', notas: '', detalles: [] }); setShowPedido(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={16} className="inline mr-1" />Pedido</button>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-lg shadow p-1">
          <button onClick={() => setTab('pedidos')} className={`flex-1 py-2 rounded-lg font-medium ${tab === 'pedidos' ? 'bg-blue-600 text-white' : ''}`}>Pedidos ({pedidos.length})</button>
          <button onClick={() => setTab('clientes')} className={`flex-1 py-2 rounded-lg font-medium ${tab === 'clientes' ? 'bg-blue-600 text-white' : ''}`}>Clientes ({clientes.length})</button>
        </div>

        {/* TABLA PEDIDOS */}
        {tab === 'pedidos' && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
              <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className="border rounded-lg px-4 py-2 flex-1">
                <option value="">Todos los clientes</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
              </select>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border rounded-lg px-4 py-2">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_preparacion">En preparación</option>
                <option value="listo">Listo</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              {(filtroCliente || filtroEstado) && (
                <button onClick={() => { setFiltroCliente(''); setFiltroEstado(''); }} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Limpiar</button>
              )}
            </div>

            <div className="space-y-4">
              {pedidosFiltrados.length === 0 && <p className="text-center text-gray-500 py-10">No hay pedidos</p>}
              {pedidosFiltrados.map(p => (
                <div key={p.id} className="bg-white rounded-lg shadow">
                  <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setPedidoExpandido(pedidoExpandido === p.id ? null : p.id)}>
                    <div>
                      <h3 className="font-bold">{p.codigo}</h3>
                      <p className="text-gray-600">{p.cliente_nombre}</p>
                      <p className="text-xs text-gray-400">{new Date(p.fecha).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        p.estado === 'en_preparacion' ? 'bg-blue-100 text-blue-800' :
                        p.estado === 'listo' ? 'bg-green-100 text-green-800' :
                        p.estado === 'entregado' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>{p.estado}</span>
                      <p className="font-bold text-lg">S/ {p.total?.toFixed(2)}</p>
                      <button onClick={e => { e.stopPropagation(); editarPedido(p); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                      {isAdmin && <button onClick={e => { e.stopPropagation(); eliminarPedido(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>}
                      {pedidoExpandido === p.id ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                  {pedidoExpandido === p.id && (
                    <div className="border-t p-4">
                      <select value={p.estado} onChange={e => cambiarEstado(p.id, e.target.value)} className="border rounded px-3 py-2 mb-3 text-sm">
                        <option value="pendiente">Pendiente</option>
                        <option value="en_preparacion">En preparación</option>
                        <option value="listo">Listo</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                      {p.notas && <p className="text-sm text-gray-500 mb-3">Notas: {p.notas}</p>}
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50"><th className="p-2 text-left">Producto</th><th className="p-2 text-right">Cant</th><th className="p-2 text-right">P.Unit</th><th className="p-2 text-right">Subtotal</th></tr></thead>
                        <tbody>{p.detalles?.map(d => <tr key={d.id}><td className="p-2">{d.producto_nombre || getProdNombre(d.producto_id)}</td><td className="p-2 text-right">{d.cantidad}</td><td className="p-2 text-right">S/ {d.precio_unitario?.toFixed(2)}</td><td className="p-2 text-right font-medium">S/ {d.subtotal?.toFixed(2)}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* TABLA CLIENTES */}
        {tab === 'clientes' && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar por nombre o código..." value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50"><th className="p-3 text-left">Código</th><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Teléfono</th><th className="p-3 text-left">Dirección</th>{isAdmin && <th className="p-3 text-left">Acciones</th>}</tr></thead>
                <tbody>
                  {clientesFiltrados.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-400">No se encontraron clientes</td></tr>}
                  {clientesFiltrados.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono">{c.codigo}</td>
                      <td className="p-3">{c.nombre}</td>
                      <td className="p-3">{c.telefono || '-'}</td>
                      <td className="p-3">{c.direccion || '-'}</td>
                      {isAdmin && (
                        <td className="p-3 flex gap-1">
                          <button onClick={() => editarCliente(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                          <button onClick={() => eliminarCliente(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Modal Cliente */}
        {showCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCliente(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">{editandoCliente ? 'Editar' : 'Nuevo'} Cliente</h2><button onClick={() => setShowCliente(false)}><X size={24} /></button></div>
              <form onSubmit={saveCliente} className="space-y-3">
                <div><label className="block text-sm font-medium mb-1">Código (opcional, auto: 001)</label><input placeholder="Dejar vacío para auto-generar" value={cForm.codigo} onChange={e => setCForm({...cForm, codigo: e.target.value})} className="w-full border p-3 rounded-lg" /></div>
                <input placeholder="Nombre *" value={cForm.nombre} onChange={e => setCForm({...cForm, nombre: e.target.value})} className="w-full border p-3 rounded-lg" required />
                <input placeholder="Teléfono" value={cForm.telefono} onChange={e => setCForm({...cForm, telefono: e.target.value})} className="w-full border p-3 rounded-lg" />
                <input placeholder="Dirección" value={cForm.direccion} onChange={e => setCForm({...cForm, direccion: e.target.value})} className="w-full border p-3 rounded-lg" />
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowCliente(false)} className="flex-1 border py-3 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-lg">{editandoCliente ? 'Actualizar' : 'Crear'}</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Pedido */}
        {showPedido && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPedido(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4"><h2 className="text-xl font-bold">{editandoPedido ? 'Editar' : 'Nuevo'} Pedido</h2><button onClick={() => setShowPedido(false)}><X size={24} /></button></div>
              <form onSubmit={savePedido} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Código (auto-generado)</label><input placeholder="Automático" value={pForm.codigo} onChange={e => setPForm({...pForm, codigo: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50" /></div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cliente *</label>
                  <input type="text" placeholder="🔍 Filtrar clientes..." value={busquedaClientePedido} onChange={e => setBusquedaClientePedido(e.target.value)} className="w-full border p-2 rounded-lg mb-1 text-sm" />
                  <select value={pForm.cliente_id} onChange={e => setPForm({...pForm, cliente_id: e.target.value})} className="w-full border p-2 rounded-lg" required size="5">
                    <option value="">Seleccionar cliente</option>
                    {clientes.filter(c => !busquedaClientePedido || c.nombre.toLowerCase().includes(busquedaClientePedido.toLowerCase()) || c.codigo.toLowerCase().includes(busquedaClientePedido.toLowerCase())).map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                  </select>
                </div>

                <textarea placeholder="Notas del pedido" value={pForm.notas} onChange={e => setPForm({...pForm, notas: e.target.value})} className="w-full border p-3 rounded-lg" rows="2" />

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Productos ({pForm.detalles.length})</h3>
                  <input type="text" placeholder="🔍 Filtrar productos..." value={busquedaProductoPedido} onChange={e => setBusquedaProductoPedido(e.target.value)} className="w-full border p-2 rounded-lg mb-1 text-sm" />
                  <div className="flex gap-2">
                    <select value={detalleActual.producto_id} onChange={e => setDetalleActual({...detalleActual, producto_id: e.target.value})} className="flex-1 border p-2 rounded" size="5">
                      <option value="">Seleccionar producto</option>
                      {productos.filter(p => !busquedaProductoPedido || p.nombre.toLowerCase().includes(busquedaProductoPedido.toLowerCase()) || p.codigo.toLowerCase().includes(busquedaProductoPedido.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
                    </select>
                    <input type="number" placeholder="Cant" value={detalleActual.cantidad} onChange={e => setDetalleActual({...detalleActual, cantidad: e.target.value})} className="w-24 border p-2 rounded" min="0.001" step="0.001" />
                    <button type="button" onClick={addDetalle} className="px-4 py-2 bg-green-600 text-white rounded font-bold">+</button>
                  </div>
                  {pForm.detalles.map((d, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded mt-2">
                      <span className="font-medium flex-1">{getProdNombre(d.producto_id)}</span>
                      <span className="text-gray-600 mr-3">x {d.cantidad}</span>
                      <button type="button" onClick={() => removeDetalle(i)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t"><button type="button" onClick={() => setShowPedido(false)} className="flex-1 border py-3 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg">{editandoPedido ? 'Actualizar' : 'Crear Pedido'}</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}