from sqlalchemy.orm import Session
from fastapi import HTTPException
import random
import string
from datetime import datetime
from ..models.despacho import Despacho
from ..models.pedido import Pedido, DetallePedido
from ..models.cliente import Cliente
from ..models.inventario import MovimientoInventario, TipoMovimiento

class DespachoService:
    def __init__(self, db: Session):
        self.db = db

    def generar_codigo(self):
        fecha = datetime.now().strftime("%Y%m%d")
        aleatorio = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        codigo = f"DES-{fecha}-{aleatorio}"
        while self.db.query(Despacho).filter(Despacho.codigo == codigo).first():
            aleatorio = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            codigo = f"DES-{fecha}-{aleatorio}"
        return codigo

    def crear_despacho(self, pedido_id: int, usuario_id: int, datos: dict):
        pedido = self.db.query(Pedido).filter(Pedido.id == pedido_id).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        if pedido.estado == "entregado":
            raise HTTPException(status_code=400, detail="Pedido ya entregado")

        codigo = self.generar_codigo()
        despacho = Despacho(
            codigo=codigo,
            pedido_id=pedido_id,
            transportista=datos.get("transportista", ""),
            vehiculo_placa=datos.get("vehiculo_placa", ""),
            direccion_entrega=datos.get("direccion_entrega", ""),
            observaciones=datos.get("observaciones", ""),
            usuario_id=usuario_id
        )
        self.db.add(despacho)
        pedido.estado = "despachado"
        self.db.commit()
        self.db.refresh(despacho)
        return self._formato_despacho(despacho)

    def obtener_despachos(self):
        despachos = self.db.query(Despacho).order_by(Despacho.created_at.desc()).all()
        return [self._formato_despacho(d) for d in despachos]

    def cambiar_estado(self, despacho_id: int, estado: str):
        despacho = self.db.query(Despacho).filter(Despacho.id == despacho_id).first()
        if not despacho:
            raise HTTPException(status_code=404, detail="Despacho no encontrado")
        despacho.estado = estado
        if estado == "entregado":
            pedido = self.db.query(Pedido).filter(Pedido.id == despacho.pedido_id).first()
            if pedido:
                pedido.estado = "entregado"
        self.db.commit()
        return self._formato_despacho(despacho)

    def eliminar_despacho(self, despacho_id: int):
        despacho = self.db.query(Despacho).filter(Despacho.id == despacho_id).first()
        if not despacho:
            raise HTTPException(status_code=404, detail="Despacho no encontrado")
        pedido = self.db.query(Pedido).filter(Pedido.id == despacho.pedido_id).first()
        if pedido:
            pedido.estado = "listo"
        self.db.delete(despacho)
        self.db.commit()
        return {"message": "Despacho eliminado"}

    def _formato_despacho(self, d):
        pedido = self.db.query(Pedido).filter(Pedido.id == d.pedido_id).first()
        cliente = self.db.query(Cliente).filter(Cliente.id == pedido.cliente_id).first() if pedido else None
        return {
            "id": d.id,
            "codigo": d.codigo,
            "pedido_id": d.pedido_id,
            "pedido_codigo": pedido.codigo if pedido else "",
            "cliente_nombre": cliente.nombre if cliente else "",
            "estado": d.estado,
            "transportista": d.transportista,
            "vehiculo_placa": d.vehiculo_placa,
            "direccion_entrega": d.direccion_entrega,
            "observaciones": d.observaciones,
            "fecha": d.created_at.isoformat() if d.created_at else None
        }