import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Inventario from './pages/Inventario';
import Pedidos from './pages/Pedidos';
import Despachos from './pages/Despachos';
import Facturacion from './pages/Facturacion';
import Reportes from './pages/Reportes';

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles.length > 0 && !roles.includes(user?.rol)) return <Navigate to="/" />;
  return <Sidebar>{children}</Sidebar>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/registro" element={<ProtectedRoute roles={['admin']}><Registro /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute roles={['admin', 'supervisor']}><Usuarios /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute roles={['admin', 'supervisor', 'bodeguero', 'despachador']}><Inventario /></ProtectedRoute>} />
        <Route path="/pedidos" element={<ProtectedRoute roles={['admin', 'bodeguero', 'vendedor']}><Pedidos /></ProtectedRoute>} />
        <Route path="/despachos" element={<ProtectedRoute roles={['admin', 'supervisor', 'despachador']}><Despachos /></ProtectedRoute>} />
        <Route path="/facturacion" element={<ProtectedRoute roles={['admin']}><Facturacion /></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute roles={['admin']}><Reportes /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;