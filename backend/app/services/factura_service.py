from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from ..models.factura import Factura, DetalleFactura
from ..models.pedido import Pedido, DetallePedido
from ..models.cliente import Cliente
from ..models.producto import Producto

class FacturaService:
    def __init__(self, db: Session):
        self.db = db

    def generar_numero(self):
        ahora = datetime.now()
        prefijo = f"F{ahora.strftime('%Y%m%d')}"
        ultima = self.db.query(Factura).filter(Factura.numero_factura.like(f"{prefijo}%")).order_by(Factura.id.desc()).first()
        if ultima:
            num = int(ultima.numero_factura[-4:]) + 1
        else:
            num = 1
        return f"{prefijo}-{num:04d}"

    def crear_factura(self, pedido_id: int):
        pedido = self.db.query(Pedido).filter(Pedido.id == pedido_id).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        existente = self.db.query(Factura).filter(Factura.pedido_id == pedido_id).first()
        if existente:
            return self._formato_factura(existente)
        detalles = self.db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido_id).all()
        subtotal = sum(float(d.subtotal or 0) for d in detalles)
        igv = subtotal * 0.18
        total = subtotal + igv
        factura = Factura(
            numero_factura=self.generar_numero(),
            pedido_id=pedido_id, cliente_id=pedido.cliente_id,
            subtotal=subtotal, igv=igv, total=total
        )
        self.db.add(factura)
        self.db.flush()
        for det in detalles:
            df = DetalleFactura(
                factura_id=factura.id, producto_id=det.producto_id,
                cantidad=det.cantidad, precio_unitario=det.precio_unitario,
                subtotal=det.subtotal
            )
            self.db.add(df)
        self.db.commit()
        self.db.refresh(factura)
        return self._formato_factura(factura)

    def obtener_facturas(self):
        facturas = self.db.query(Factura).order_by(Factura.created_at.desc()).all()
        return [self._formato_factura(f) for f in facturas]

    def cambiar_estado_pago(self, factura_id: int, estado: str):
        factura = self.db.query(Factura).filter(Factura.id == factura_id).first()
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")
        factura.estado_pago = estado
        self.db.commit()
        return self._formato_factura(factura)

    def eliminar_factura(self, factura_id: int):
        factura = self.db.query(Factura).filter(Factura.id == factura_id).first()
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")
        self.db.query(DetalleFactura).filter(DetalleFactura.factura_id == factura_id).delete()
        self.db.delete(factura)
        self.db.commit()
        return {"message": "Factura eliminada"}

    def _formato_factura(self, f):
        cliente = self.db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
        detalles = self.db.query(DetalleFactura).filter(DetalleFactura.factura_id == f.id).all()
        return {
            "id": f.id, "numero_factura": f.numero_factura,
            "pedido_id": f.pedido_id,
            "cliente_nombre": cliente.nombre if cliente else "",
            "fecha": f.created_at.isoformat() if f.created_at else None,
            "subtotal": float(f.subtotal), "igv": float(f.igv), "total": float(f.total),
            "estado_pago": f.estado_pago,
            "detalles": [{
                "producto_nombre": self.db.query(Producto).filter(Producto.id == d.producto_id).first().nombre if self.db.query(Producto).filter(Producto.id == d.producto_id).first() else "",
                "cantidad": float(d.cantidad),
                "precio_unitario": float(d.precio_unitario) if d.precio_unitario else 0,
                "subtotal": float(d.subtotal) if d.subtotal else 0
            } for d in detalles]
        }