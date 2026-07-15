from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models.producto import Producto, Categoria
from ..models.inventario import MovimientoInventario, TipoMovimiento
from ..models.pedido import Pedido, DetallePedido
from ..models.factura import Factura
from ..models.cliente import Cliente

class ReporteService:
    def __init__(self, db: Session):
        self.db = db

    def inventario_valorizado(self):
        productos = self.db.query(Producto).filter(Producto.activo == True).all()
        resultado = []
        total_costo = 0
        total_venta = 0
        
        for p in productos:
            stock = self._stock_producto(p.id)
            cat = self.db.query(Categoria).filter(Categoria.id == p.categoria_id).first()
            costo = float(p.precio_compra or 0) * stock
            venta = float(p.precio_venta or 0) * stock
            total_costo += costo
            total_venta += venta
            
            resultado.append({
                "codigo": p.codigo,
                "nombre": p.nombre,
                "categoria": cat.nombre if cat else "",
                "stock": stock,
                "precio_compra": float(p.precio_compra or 0),
                "precio_venta": float(p.precio_venta or 0),
                "valor_costo": costo,
                "valor_venta": venta,
                "ganancia": venta - costo
            })
        
        return {
            "fecha": datetime.now().isoformat(),
            "total_productos": len(resultado),
            "total_costo": total_costo,
            "total_venta": total_venta,
            "ganancia_potencial": total_venta - total_costo,
            "detalle": resultado
        }

    def ventas_por_periodo(self, dias: int = 30):
        desde = datetime.now() - timedelta(days=dias)
        facturas = self.db.query(Factura).filter(Factura.created_at >= desde).all()
        
        resultado = []
        total = 0
        for f in facturas:
            cliente = self.db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
            total += float(f.total)
            resultado.append({
                "factura": f.numero_factura,
                "cliente": cliente.nombre if cliente else "",
                "fecha": f.created_at.isoformat() if f.created_at else None,
                "subtotal": float(f.subtotal),
                "igv": float(f.igv),
                "total": float(f.total),
                "estado_pago": f.estado_pago
            })
        
        return {
            "periodo": f"Últimos {dias} días",
            "total_facturas": len(resultado),
            "total_ventas": total,
            "detalle": resultado
        }

    def movimientos_por_producto(self, producto_id: int = None):
        query = self.db.query(MovimientoInventario).order_by(MovimientoInventario.created_at.desc())
        if producto_id:
            query = query.filter(MovimientoInventario.producto_id == producto_id)
        movimientos = query.limit(500).all()
        
        return [{
            "fecha": m.created_at.isoformat() if m.created_at else None,
            "producto_id": m.producto_id,
            "tipo": m.tipo_movimiento.value if m.tipo_movimiento else "",
            "cantidad": float(m.cantidad),
            "motivo": m.motivo or "",
            "lote": m.lote or ""
        } for m in movimientos]

    def _stock_producto(self, producto_id: int):
        movimientos = self.db.query(MovimientoInventario).filter(
            MovimientoInventario.producto_id == producto_id
        ).all()
        stock = 0
        for m in movimientos:
            if m.tipo_movimiento in [TipoMovimiento.ENTRADA, TipoMovimiento.AJUSTE]:
                stock += float(m.cantidad)
            else:
                stock -= float(m.cantidad)
        return stock