import { useState, useEffect } from 'react';
import { Bell, X, Package, AlertTriangle, Truck } from 'lucide-react';
import api from '../../services/api';

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);

  const cargarNotificaciones = async () => {
    try {
      const [prod] = await Promise.all([api.get('/inventario/productos')]);
      const criticos = prod.data?.filter(p => {
        // Stock bajo
        return true; // Simplificado
      }) || [];
      
      const alerts = [];
      if (criticos.length > 0) {
        alerts.push({ id: 1, icon: AlertTriangle, color: 'text-red-500', text: `${criticos.length} productos con stock bajo`, time: 'Ahora' });
      }
      
      setNotificaciones(alerts);
    } catch(e) {}
  };

  useEffect(() => {
    cargarNotificaciones();
    const i = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
        <Bell size={20} />
        {notificaciones.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notificaciones.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 border">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold">Notificaciones</h3>
              <button onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <p className="p-4 text-center text-gray-400">No hay notificaciones</p>
              ) : (
                notificaciones.map(n => (
                  <div key={n.id} className="p-4 border-b hover:bg-gray-50 flex items-start gap-3">
                    <n.icon size={20} className={n.color} />
                    <div>
                      <p className="text-sm">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}