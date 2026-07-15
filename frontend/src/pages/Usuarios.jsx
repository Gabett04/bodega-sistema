import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Search, Shield, CheckCircle, XCircle, Edit, Power, PowerOff } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Usuarios = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/usuarios');
      setUsuarios(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const eliminarUsuario = async (id, username) => {
    if (!window.confirm(`¿Eliminar al usuario "${username}"?`)) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar');
    }
  };

  const toggleActivo = async (id) => {
    try {
      await api.put(`/auth/usuarios/${id}/toggle`);
      cargarUsuarios();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.username?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando usuarios...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Usuarios</h1>
            <p className="text-gray-600 text-sm mt-1">{usuarios.length} registrados</p>
          </div>
          <div className="flex gap-2">
            <button onClick={cargarUsuarios} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">
              Actualizar
            </button>
            {isAdmin && (
              <Link to="/registro" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
                <Plus size={16} /> Nuevo
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 lg:p-4 mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar usuario..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Vista móvil: Cards */}
        <div className="lg:hidden space-y-3">
          {usuariosFiltrados.map(u => (
            <div key={u.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{u.nombre_completo}</p>
                  <p className="text-sm text-gray-500">@{u.username}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  u.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                  u.rol === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>{u.rol}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{u.email}</p>
              <div className="flex gap-2">
                {u.activo ? (
                  <span className="text-green-700 text-xs flex items-center gap-1"><CheckCircle size={14} /> Activo</span>
                ) : (
                  <span className="text-red-700 text-xs flex items-center gap-1"><XCircle size={14} /> Inactivo</span>
                )}
                {isAdmin && (
                  <div className="flex gap-1 ml-auto">
                    <button onClick={() => toggleActivo(u.id)} className={`p-1.5 rounded ${u.activo ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {u.activo ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                    <button onClick={() => eliminarUsuario(u.id, u.username)} className="p-1.5 bg-red-100 text-red-600 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vista escritorio: Tabla */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuariosFiltrados.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">#{u.id}</td>
                  <td className="px-6 py-4 font-medium">{u.username}</td>
                  <td className="px-6 py-4 text-sm">{u.nombre_completo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.rol === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>{u.rol}</span>
                  </td>
                  <td className="px-6 py-4">
                    {u.activo ? (
                      <span className="text-green-700 text-xs flex items-center gap-1"><CheckCircle size={14} /> Activo</span>
                    ) : (
                      <span className="text-red-700 text-xs flex items-center gap-1"><XCircle size={14} /> Inactivo</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => toggleActivo(u.id)} className={`p-1.5 rounded ${u.activo ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          {u.activo ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        <button onClick={() => eliminarUsuario(u.id, u.username)} className="p-1.5 bg-red-100 text-red-600 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {usuariosFiltrados.length === 0 && (
          <p className="text-center text-gray-400 py-10">No se encontraron usuarios</p>
        )}
      </div>
    </div>
  );
};

export default Usuarios;