import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Registro = () => {
  const [form, setForm] = useState({
    username: '', password: '', nombre_completo: '', email: '', rol: 'bodeguero'
  });
  const { registro, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await registro(form);
    if (ok) {
      alert('Usuario creado exitosamente');
      navigate('/usuarios');
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Crear Usuario</h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1">Solo administradores</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 lg:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input type="text" name="nombre_completo" value={form.nombre_completo} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input type="text" name="username" value={form.username} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select name="rol" value={form.rol} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="bodeguero">Bodeguero</option>
                <option value="supervisor">Supervisor</option>
                <option value="despachador">Despachador</option>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
              {loading ? 'Creando usuario...' : 'Crear Usuario'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/usuarios" className="text-blue-600 hover:underline font-medium text-sm">
              ← Volver a Usuarios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;