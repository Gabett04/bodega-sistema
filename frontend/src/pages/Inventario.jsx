import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Package, Search, Tags, Ruler, ArrowDown, X, Edit, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('productos');
  const [filtro, setFiltro] = useState('');
  const [filtroMov, setFiltroMov] = useState('');

  const [showProducto, setShowProducto] = useState(false);
  const [showCategoria, setShowCategoria] = useState(false);
  const [showUnidad, setShowUnidad] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [showGestionCat, setShowGestionCat] = useState(false);
  const [showGestionUni, setShowGestionUni] = useState(false);
  const [prodSeleccionado, setProdSeleccionado] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoCat, setEditandoCat] = useState(null);
  const [editandoUni, setEditandoUni] = useState(null);

  const [pForm, setPForm] = useState({ codigo:'', nombre:'', descripcion:'', categoria_id:'', unidad_base_id:'', precio_compra:'', precio_venta:'', stock_minimo:'0', perecedero:false, dias_vencimiento:'' });
  const [cForm, setCForm] = useState({ nombre:'', descripcion:'' });
  const [uForm, setUForm] = useState({ nombre:'', abreviacion:'', tipo:'' });
  const [mForm, setMForm] = useState({ tipo:'entrada', cantidad:'', lote:'', motivo:'' });

  const loadData = async () => {
    try {
      const [p, c, u, m] = await Promise.all([
        api.get('/inventario/productos'),
        api.get('/inventario/categorias'),
        api.get('/inventario/unidades'),
        api.get('/inventario/movimientos')
      ]);
      setProductos(p.data||[]);
      setCategorias(c.data||[]);
      setUnidades(u.data||[]);
      setMovimientos(m.data||[]);
    } catch(e){}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!showProducto && !showCategoria && !showUnidad && !showMovimiento && !showGestionCat && !showGestionUni) {
        loadData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [showProducto, showCategoria, showUnidad, showMovimiento, showGestionCat, showGestionUni]);

  const stock = (pid) => { let s=0; movimientos.filter(m=>m.producto_id===pid).forEach(m=>{ s+=['entrada','ajuste'].includes(m.tipo_movimiento)?+m.cantidad:-m.cantidad; }); return s; };
  const getCat = (id) => categorias.find(c=>c.id===id)?.nombre||'-';
  const getUni = (id) => unidades.find(u=>u.id===id)?.abreviacion||'-';

  const saveCategoria = async (e) => { e.preventDefault();
    if(editandoCat){ await api.put(`/inventario/categorias/${editandoCat}`,cForm); setEditandoCat(null); }
    else { await api.post('/inventario/categorias',cForm); }
    setShowCategoria(false); setCForm({nombre:'',descripcion:''}); loadData();
  };
  const saveUnidad = async (e) => { e.preventDefault();
    if(editandoUni){ await api.put(`/inventario/unidades/${editandoUni}`,uForm); setEditandoUni(null); }
    else { await api.post('/inventario/unidades',uForm); }
    setShowUnidad(false); setUForm({nombre:'',abreviacion:'',tipo:''}); loadData();
  };

  const editarCat = (c) => { setEditandoCat(c.id); setCForm({nombre:c.nombre,descripcion:c.descripcion||''}); setShowCategoria(true); };
  const delCat = async (id) => { if(!confirm('¿Eliminar categoría?'))return; await api.delete(`/inventario/categorias/${id}`); loadData(); };
  const editarUni = (u) => { setEditandoUni(u.id); setUForm({nombre:u.nombre,abreviacion:u.abreviacion,tipo:u.tipo||''}); setShowUnidad(true); };
  const delUni = async (id) => { if(!confirm('¿Eliminar unidad?'))return; await api.delete(`/inventario/unidades/${id}`); loadData(); };

  const nuevoProducto = () => { setEditandoId(null); setPForm({codigo:'',nombre:'',descripcion:'',categoria_id:'',unidad_base_id:'',precio_compra:'',precio_venta:'',stock_minimo:'0',perecedero:false,dias_vencimiento:''}); setShowProducto(true); };
  const editarProducto = (p) => { setEditandoId(p.id); setPForm({codigo:p.codigo,nombre:p.nombre,descripcion:p.descripcion||'',categoria_id:p.categoria_id,unidad_base_id:p.unidad_base_id,precio_compra:p.precio_compra||'',precio_venta:p.precio_venta||'',stock_minimo:p.stock_minimo||'0',perecedero:p.perecedero||false,dias_vencimiento:p.dias_vencimiento||''}); setShowProducto(true); };
  
  const saveProducto = async (e) => { 
    e.preventDefault();
    const d={
      codigo:pForm.codigo, nombre:pForm.nombre, descripcion:pForm.descripcion,
      categoria_id:parseInt(pForm.categoria_id), unidad_base_id:parseInt(pForm.unidad_base_id),
      precio_compra:pForm.precio_compra?parseFloat(pForm.precio_compra):null,
      precio_venta:pForm.precio_venta?parseFloat(pForm.precio_venta):null,
      stock_minimo:parseFloat(pForm.stock_minimo)||0,
      perecedero:pForm.perecedero,
      dias_vencimiento:pForm.perecedero?(parseInt(pForm.dias_vencimiento)||null):null
    };
    try {
      if(editandoId){ await api.put(`/inventario/productos/${editandoId}`,d); }
      else { await api.post('/inventario/productos',d); }
      setShowProducto(false); setEditandoId(null); loadData();
    } catch(err){ alert(err.response?.data?.detail||'Error al guardar producto'); }
  };

  const delProducto = async (id,nom) => { if(!confirm(`¿Eliminar "${nom}"?`))return; await api.delete(`/inventario/productos/${id}`); loadData(); };

  const abrirMov = (p) => { setProdSeleccionado(p); setMForm({tipo:'entrada',cantidad:'',lote:'',motivo:''}); setShowMovimiento(true); };
  
  const saveMov = async (e) => { 
    e.preventDefault();
    try {
      await api.post(`/inventario/productos/${prodSeleccionado.id}/movimiento`,{
        tipo:mForm.tipo, cantidad:parseFloat(mForm.cantidad),
        lote:mForm.lote||null, motivo:mForm.motivo||null, ubicacion_id:1
      });
      setShowMovimiento(false); setProdSeleccionado(null); loadData();
    } catch(err){ alert(err.response?.data?.detail||'Error al registrar movimiento'); }
  };

  const delMov = async (id) => { if(!confirm('¿Eliminar movimiento?'))return; await api.delete(`/inventario/movimientos/${id}`); loadData(); };

  if(loading) return <div className="p-10 text-center text-xl">Cargando inventario...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold"><Package size={32} className="inline text-blue-600 mr-2"/>Inventario</h1>
          <div className="flex gap-2 flex-wrap">
            <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">← Dashboard</Link>
            <button onClick={()=>setShowGestionCat(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"><Tags size={16} className="inline mr-1"/>Categorías</button>
            <button onClick={()=>setShowGestionUni(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"><Ruler size={16} className="inline mr-1"/>Unidades</button>
            <button onClick={nuevoProducto} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"><Plus size={16} className="inline mr-1"/>Producto</button>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-lg shadow p-1">
          <button onClick={()=>setTab('productos')} className={`flex-1 py-2 rounded-lg font-medium ${tab==='productos'?'bg-blue-600 text-white':''}`}>Productos ({productos.length})</button>
          <button onClick={()=>{setTab('movimientos');setFiltroMov('');}} className={`flex-1 py-2 rounded-lg font-medium ${tab==='movimientos'?'bg-blue-600 text-white':''}`}>Movimientos ({movimientos.length})</button>
        </div>

        {tab==='productos'&&(
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6"><div className="relative"><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input placeholder="Buscar..." value={filtro} onChange={e=>setFiltro(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg"/></div></div>
            <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50 border-b"><th className="p-3 text-left text-xs font-medium uppercase">Código</th><th className="p-3 text-left text-xs font-medium uppercase">Producto</th><th className="p-3 text-left text-xs font-medium uppercase">Cat</th><th className="p-3 text-left text-xs font-medium uppercase">Uni</th><th className="p-3 text-left text-xs font-medium uppercase">Stock</th><th className="p-3 text-left text-xs font-medium uppercase">Stock Mín</th><th className="p-3 text-left text-xs font-medium uppercase">P.Compra</th><th className="p-3 text-left text-xs font-medium uppercase">P.Venta</th><th className="p-3 text-left text-xs font-medium uppercase">Acciones</th></tr></thead><tbody className="divide-y">
              {productos.filter(p=>(p.nombre||'').toLowerCase().includes(filtro.toLowerCase())||(p.codigo||'').toLowerCase().includes(filtro.toLowerCase())).map(p=>{const s=stock(p.id);const critico=s<=(p.stock_minimo||0);return(<tr key={p.id} className="hover:bg-gray-50"><td className="p-3 text-sm font-mono">{p.codigo}</td><td className="p-3 font-medium">{p.nombre}</td><td className="p-3 text-sm">{getCat(p.categoria_id)}</td><td className="p-3 text-sm">{getUni(p.unidad_base_id)}</td><td className={`p-3 font-bold ${critico?'text-red-600':'text-green-600'}`}>{s}{critico&&<AlertTriangle size={14} className="inline ml-1"/>}</td><td className="p-3 text-sm">{p.stock_minimo||0}</td><td className="p-3 text-sm">{p.precio_compra?`S/ ${p.precio_compra}`:'-'}</td><td className="p-3 text-sm text-green-700 font-medium">{p.precio_venta?`S/ ${p.precio_venta}`:'-'}</td><td className="p-3"><div className="flex gap-1"><button onClick={()=>abrirMov(p)} className="p-2 bg-green-100 text-green-600 rounded"><ArrowDown size={14}/></button><button onClick={()=>editarProducto(p)} className="p-2 bg-blue-100 text-blue-600 rounded"><Edit size={14}/></button><button onClick={()=>delProducto(p.id,p.nombre)} className="p-2 bg-red-100 text-red-600 rounded"><Trash2 size={14}/></button></div></td></tr>)})}
              {productos.filter(p=>(p.nombre||'').toLowerCase().includes(filtro.toLowerCase())||(p.codigo||'').toLowerCase().includes(filtro.toLowerCase())).length===0&&<tr><td colSpan={9} className="p-10 text-center text-gray-400">No hay productos</td></tr>}
            </tbody></table></div>
          </>
        )}

        {tab==='movimientos'&&(
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6"><div className="flex gap-4 items-center"><label className="text-sm font-medium">Filtrar por producto:</label><select value={filtroMov} onChange={e=>setFiltroMov(e.target.value)} className="border rounded-lg px-4 py-2 flex-1"><option value="">Todos los productos</option>{productos.map(p=><option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}</select>{filtroMov&&<button onClick={()=>setFiltroMov('')} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Limpiar</button>}</div></div>

            {filtroMov&&(()=>{const prod=productos.find(p=>p.id===+filtroMov);const movsF=movimientos.filter(m=>m.producto_id===+filtroMov);const s=stock(+filtroMov);const ent=movsF.filter(m=>['entrada','ajuste'].includes(m.tipo_movimiento)).reduce((a,b)=>a+parseFloat(b.cantidad),0);const sal=movsF.filter(m=>['salida','merma'].includes(m.tipo_movimiento)).reduce((a,b)=>a+parseFloat(b.cantidad),0);return(<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"><h3 className="font-bold text-lg">{prod?.codigo} - {prod?.nombre}</h3><div className="grid grid-cols-4 gap-4 mt-2"><div><p className="text-sm text-gray-600">Stock Actual</p><p className={`text-2xl font-bold ${s<=(prod?.stock_minimo||0)?'text-red-600':'text-green-600'}`}>{s}</p></div><div><p className="text-sm text-gray-600">Entradas</p><p className="text-2xl font-bold text-green-600">+{ent}</p></div><div><p className="text-sm text-gray-600">Salidas</p><p className="text-2xl font-bold text-red-600">-{sal}</p></div><div><p className="text-sm text-gray-600">Total Mov.</p><p className="text-2xl font-bold text-blue-600">{movsF.length}</p></div></div></div>)})()}

            <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50 border-b"><th className="p-3 text-left text-xs font-medium uppercase">Fecha</th><th className="p-3 text-left text-xs font-medium uppercase">Código</th><th className="p-3 text-left text-xs font-medium uppercase">Producto</th><th className="p-3 text-left text-xs font-medium uppercase">Tipo</th><th className="p-3 text-left text-xs font-medium uppercase">Cant</th><th className="p-3 text-left text-xs font-medium uppercase">Motivo</th><th className="p-3 text-left text-xs font-medium uppercase">Lote</th><th className="p-3 text-left text-xs font-medium uppercase">Acción</th></tr></thead><tbody className="divide-y">
              {[...movimientos].filter(m=>!filtroMov||m.producto_id===+filtroMov).reverse().map(m=>{const prod=productos.find(p=>p.id===m.producto_id);return(<tr key={m.id} className="hover:bg-gray-50"><td className="p-3 text-sm whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</td><td className="p-3 text-sm font-mono">{prod?.codigo||`ID:${m.producto_id}`}</td><td className="p-3 text-sm">{prod?.nombre||'-'}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs font-medium ${m.tipo_movimiento==='entrada'?'bg-green-100 text-green-800':m.tipo_movimiento==='salida'?'bg-red-100 text-red-800':m.tipo_movimiento==='merma'?'bg-orange-100 text-orange-800':'bg-blue-100 text-blue-800'}`}>{m.tipo_movimiento}</span></td><td className={`p-3 font-bold ${['entrada','ajuste'].includes(m.tipo_movimiento)?'text-green-600':'text-red-600'}`}>{['entrada','ajuste'].includes(m.tipo_movimiento)?'+':'-'}{m.cantidad}</td><td className="p-3 text-sm text-gray-600">{m.motivo||'-'}</td><td className="p-3 text-sm text-gray-500">{m.lote||'-'}</td><td className="p-3"><button onClick={()=>delMov(m.id)} className="p-2 bg-red-100 text-red-600 rounded"><Trash2 size={14}/></button></td></tr>)})}
              {movimientos.filter(m=>!filtroMov||m.producto_id===+filtroMov).length===0&&<tr><td colSpan={8} className="p-10 text-center text-gray-400">Sin movimientos</td></tr>}
            </tbody></table></div>
          </>
        )}

        {/* MODAL CATEGORIA */}
        {showCategoria&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setShowCategoria(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">{editandoCat?'Editar':'Nueva'} Categoría</h2><button onClick={()=>setShowCategoria(false)}><X size={24}/></button></div><form onSubmit={saveCategoria} className="space-y-4"><input placeholder="Nombre *" value={cForm.nombre} onChange={e=>setCForm({...cForm,nombre:e.target.value})} className="w-full border p-3 rounded-lg" required/><input placeholder="Descripción" value={cForm.descripcion} onChange={e=>setCForm({...cForm,descripcion:e.target.value})} className="w-full border p-3 rounded-lg"/><button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium">{editandoCat?'Actualizar':'Crear'}</button></form></div></div>)}

        {/* MODAL UNIDAD */}
        {showUnidad&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setShowUnidad(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">{editandoUni?'Editar':'Nueva'} Unidad</h2><button onClick={()=>setShowUnidad(false)}><X size={24}/></button></div><form onSubmit={saveUnidad} className="space-y-4"><input placeholder="Nombre *" value={uForm.nombre} onChange={e=>setUForm({...uForm,nombre:e.target.value})} className="w-full border p-3 rounded-lg" required/><input placeholder="Abreviación *" value={uForm.abreviacion} onChange={e=>setUForm({...uForm,abreviacion:e.target.value})} className="w-full border p-3 rounded-lg" required/><select value={uForm.tipo} onChange={e=>setUForm({...uForm,tipo:e.target.value})} className="w-full border p-3 rounded-lg"><option value="">Tipo</option><option value="peso">Peso</option><option value="volumen">Volumen</option><option value="unidad">Unidad</option><option value="paquete">Paquete</option></select><button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium">{editandoUni?'Actualizar':'Crear'}</button></form></div></div>)}

        {/* MODAL GESTION CATEGORIAS */}
        {showGestionCat&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setShowGestionCat(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Categorías</h2><button onClick={()=>setShowGestionCat(false)}><X size={24}/></button></div><button onClick={()=>{setEditandoCat(null);setCForm({nombre:'',descripcion:''});setShowCategoria(true);}} className="w-full mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg"><Plus size={16} className="inline mr-1"/>Nueva</button><div className="space-y-2">{categorias.map(c=>(<div key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"><div><p className="font-medium">{c.nombre}</p><p className="text-sm text-gray-500">{c.descripcion}</p></div><div className="flex gap-1"><button onClick={()=>editarCat(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button><button onClick={()=>delCat(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div></div>))}</div></div></div>)}

        {/* MODAL GESTION UNIDADES */}
        {showGestionUni&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setShowGestionUni(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Unidades</h2><button onClick={()=>setShowGestionUni(false)}><X size={24}/></button></div><button onClick={()=>{setEditandoUni(null);setUForm({nombre:'',abreviacion:'',tipo:''});setShowUnidad(true);}} className="w-full mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"><Plus size={16} className="inline mr-1"/>Nueva</button><div className="space-y-2">{unidades.map(u=>(<div key={u.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"><div><p className="font-medium">{u.nombre} <span className="text-gray-500">({u.abreviacion})</span></p><p className="text-sm text-gray-400">{u.tipo}</p></div><div className="flex gap-1"><button onClick={()=>editarUni(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button><button onClick={()=>delUni(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button></div></div>))}</div></div></div>)}

        {/* MODAL PRODUCTO */}
        {showProducto&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setShowProducto(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">{editandoId?'Editar':'Nuevo'} Producto</h2><button onClick={()=>{setShowProducto(false);setEditandoId(null);}}><X size={24}/></button></div><form onSubmit={saveProducto} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Código *</label><input value={pForm.codigo} onChange={e=>setPForm({...pForm,codigo:e.target.value})} className="w-full border p-3 rounded-lg" required/></div><div><label className="block text-sm font-medium mb-1">Nombre *</label><input value={pForm.nombre} onChange={e=>setPForm({...pForm,nombre:e.target.value})} className="w-full border p-3 rounded-lg" required/></div><div className="col-span-2"><label className="block text-sm font-medium mb-1">Descripción</label><textarea value={pForm.descripcion} onChange={e=>setPForm({...pForm,descripcion:e.target.value})} className="w-full border p-3 rounded-lg" rows="2"/></div><div><label className="block text-sm font-medium mb-1">Categoría *</label><select value={pForm.categoria_id} onChange={e=>setPForm({...pForm,categoria_id:e.target.value})} className="w-full border p-3 rounded-lg" required><option value="">Seleccionar</option>{categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Unidad *</label><select value={pForm.unidad_base_id} onChange={e=>setPForm({...pForm,unidad_base_id:e.target.value})} className="w-full border p-3 rounded-lg" required><option value="">Seleccionar</option>{unidades.map(u=><option key={u.id} value={u.id}>{u.nombre} ({u.abreviacion})</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Precio Compra</label><input type="number" step="0.01" value={pForm.precio_compra} onChange={e=>setPForm({...pForm,precio_compra:e.target.value})} className="w-full border p-3 rounded-lg"/></div><div><label className="block text-sm font-medium mb-1">Precio Venta</label><input type="number" step="0.01" value={pForm.precio_venta} onChange={e=>setPForm({...pForm,precio_venta:e.target.value})} className="w-full border p-3 rounded-lg"/></div><div><label className="block text-sm font-medium mb-1">Stock Mínimo</label><input type="number" value={pForm.stock_minimo} onChange={e=>setPForm({...pForm,stock_minimo:e.target.value})} className="w-full border p-3 rounded-lg"/></div><div className="flex items-center gap-3 mt-6"><input type="checkbox" checked={pForm.perecedero} onChange={e=>setPForm({...pForm,perecedero:e.target.checked})} className="w-5 h-5"/><label className="text-sm font-medium">Perecedero</label></div>{pForm.perecedero&&<div><label className="block text-sm font-medium mb-1">Días Vencimiento</label><input type="number" value={pForm.dias_vencimiento} onChange={e=>setPForm({...pForm,dias_vencimiento:e.target.value})} className="w-full border p-3 rounded-lg"/></div>}</div><div className="flex gap-3 pt-4"><button type="button" onClick={()=>{setShowProducto(false);setEditandoId(null);}} className="flex-1 border py-3 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg">{editandoId?'Actualizar':'Crear'}</button></div></form></div></div>)}

        {/* MODAL MOVIMIENTO */}
        {showMovimiento&&prodSeleccionado&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={()=>setShowMovimiento(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="text-xl font-bold">Movimiento</h2><button onClick={()=>setShowMovimiento(false)}><X size={24}/></button></div><p className="mb-4">Producto: <strong>{prodSeleccionado.nombre}</strong> | Stock: <strong>{stock(prodSeleccionado.id)}</strong></p><form onSubmit={saveMov} className="space-y-4"><select value={mForm.tipo} onChange={e=>setMForm({...mForm,tipo:e.target.value})} className="w-full border p-3 rounded-lg"><option value="entrada">Entrada (+)</option><option value="salida">Salida (-)</option><option value="ajuste">Ajuste</option><option value="merma">Merma (-)</option></select><input type="number" step="0.001" placeholder="Cantidad *" value={mForm.cantidad} onChange={e=>setMForm({...mForm,cantidad:e.target.value})} className="w-full border p-3 rounded-lg" required/><input placeholder="Lote" value={mForm.lote} onChange={e=>setMForm({...mForm,lote:e.target.value})} className="w-full border p-3 rounded-lg"/><input placeholder="Motivo" value={mForm.motivo} onChange={e=>setMForm({...mForm,motivo:e.target.value})} className="w-full border p-3 rounded-lg"/><div className="flex gap-3"><button type="button" onClick={()=>setShowMovimiento(false)} className="flex-1 border py-3 rounded-lg">Cancelar</button><button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg">Registrar</button></div></form></div></div>)}
      </div>
    </div>
  );
}