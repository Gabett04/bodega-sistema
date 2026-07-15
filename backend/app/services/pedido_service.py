from sqlalchemy.orm import Session
from fastapi import HTTPException
import random
import string
from datetime import datetime
from ..models.cliente import Cliente
from ..models.pedido import Pedido, DetallePedido
from ..models.producto import Producto
from ..models.inventario import MovimientoInventario, TipoMovimiento
from ..schemas.cliente import ClienteCreate, PedidoCreate

class PedidoService:
    def __init__(self, db: Session):
        self.db = db

    def generar_codigo_pedido(self):
        fecha = datetime.now().strftime("%Y%m%d")
        aleatorio = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        codigo = f"PED-{fecha}-{aleatorio}"
        while self.db.query(Pedido).filter(Pedido.codigo == codigo).first():
            aleatorio = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            codigo = f"PED-{fecha}-{aleatorio}"
        return codigo

    def generar_codigo_cliente(self):
        ultimo = self.db.query(Cliente).order_by(Cliente.id.desc()).first()
        numero = (ultimo.id + 1) if ultimo else 1
        return f"{numero:03d}"

    # ==================== CLIENTES ====================
    def crear_cliente(self, datos: ClienteCreate):
        codigo = datos.codigo.strip() if datos.codigo and datos.codigo.strip() else self.generar_codigo_cliente()
        if self.db.query(Cliente).filter(Cliente.codigo == codigo).first():
            if datos.codigo and datos.codigo.strip():
                raise HTTPException(status_code=400, detail="El código ya existe")
            codigo = self.generar_codigo_cliente()
        cliente = Cliente(codigo=codigo, nombre=datos.nombre, tipo_documento=datos.tipo_documento, numero_documento=datos.numero_documento, direccion=datos.direccion, telefono=datos.telefono, email=datos.email)
        self.db.add(cliente)
        self.db.commit()
        self.db.refresh(cliente)
        return self._formato_cliente(cliente)

    def obtener_clientes(self):
        return [self._formato_cliente(c) for c in self.db.query(Cliente).all()]

    def actualizar_cliente(self, cliente_id: int, datos: ClienteCreate):
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        cliente.nombre = datos.nombre
        cliente.telefono = datos.telefono
        cliente.direccion = datos.direccion
        cliente.email = datos.email
        self.db.commit()
        return self._formato_cliente(cliente)

    def eliminar_cliente(self, cliente_id: int):
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        pedidos = self.db.query(Pedido).filter(Pedido.cliente_id == cliente_id).all()
        for pedido in pedidos:
            self.db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido.id).delete()
            self.db.delete(pedido)
        self.db.delete(cliente)
        self.db.commit()
        return {"message": "Cliente eliminado"}

    def _formato_cliente(self, c):
        return {"id": c.id, "codigo": c.codigo, "nombre": c.nombre, "telefono": c.telefono, "direccion": c.direccion, "email": c.email}

    # ==================== PEDIDOS ====================
    def crear_pedido(self, datos: PedidoCreate, usuario_id: int):
        codigo = datos.codigo if datos.codigo else self.generar_codigo_pedido()
        if self.db.query(Pedido).filter(Pedido.codigo == codigo).first():
            codigo = self.generar_codigo_pedido()
        pedido = Pedido(codigo=codigo, cliente_id=datos.cliente_id, notas=datos.notas, usuario_id=usuario_id)
        self.db.add(pedido)
        self.db.flush()
        for det in datos.detalles:
            producto = self.db.query(Producto).filter(Producto.id == det.producto_id).first()
            precio = det.precio_unitario or (producto.precio_venta if producto and producto.precio_venta else 0)
            detalle = DetallePedido(pedido_id=pedido.id, producto_id=det.producto_id, cantidad=det.cantidad, precio_unitario=precio, subtotal=det.cantidad * precio)
            self.db.add(detalle)
            # Descontar del inventario
            movimiento = MovimientoInventario(
                producto_id=det.producto_id, tipo_movimiento=TipoMovimiento.SALIDA,
                cantidad=det.cantidad, unidad_id=producto.unidad_base_id if producto else None,
                ubicacion_origen_id=1, motivo=f"Pedido {codigo}", usuario_id=usuario_id
            )
            self.db.add(movimiento)
        self.db.commit()
        self.db.refresh(pedido)
        return self._formato_pedido(pedido)

    def obtener_pedidos(self):
        return [self._formato_pedido(p) for p in self.db.query(Pedido).order_by(Pedido.created_at.desc()).all()]

    def actualizar_pedido(self, pedido_id: int, datos: PedidoCreate):
        pedido = self.db.query(Pedido).filter(Pedido.id == pedido_id).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        # Devolver stock del pedido anterior
        detalles_antiguos = self.db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido_id).all()
        for det in detalles_antiguos:
            movimiento = MovimientoInventario(
                producto_id=det.producto_id, tipo_movimiento=TipoMovimiento.ENTRADA,
                cantidad=det.cantidad, motivo=f"Edición pedido {pedido.codigo}", usuario_id=pedido.usuario_id
            )
            self.db.add(movimiento)
        # Eliminar detalles antiguos
        self.db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido_id).delete()
        # Agregar nuevos detalles
        pedido.cliente_id = datos.cliente_id
        pedido.notas = datos.notas
        for det in datos.detalles:
            producto = self.db.query(Producto).filter(Producto.id == det.producto_id).first()
            precio = det.precio_unitario or (producto.precio_venta if producto and producto.precio_venta else 0)
            detalle = DetallePedido(pedido_id=pedido.id, producto_id=det.producto_id, cantidad=det.cantidad, precio_unitario=precio, subtotal=det.cantidad * precio)
            self.db.add(detalle)
            # Descontar nuevo stock
            movimiento = MovimientoInventario(
                producto_id=det.producto_id, tipo_movimiento=TipoMovimiento.SALIDA,
                cantidad=det.cantidad, motivo=f"Edición pedido {pedido.codigo}", usuario_id=pedido.usuario_id
            )
            self.db.add(movimiento)
        self.db.commit()
        self.db.refresh(pedido)
        return self._formato_pedido(pedido)

    def cambiar_estado(self, pedido_id: int, estado: str):
        pedido = self.db.query(Pedido).filter(Pedido.id == pedido_id).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        estado_anterior = pedido.estado
        pedido.estado = estado
        # Si cancela, devolver stock
        if estado == "cancelado" and estado_anterior != "cancelado":
            detalles = self.db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido_id).all()
            for det in detalles:
                movimiento = MovimientoInventario(
                    producto_id=det.producto_id, tipo_movimiento=TipoMovimiento.ENTRADA,
                    cantidad=det.cantidad, motivo=f"Cancelación {pedido.codigo}", usuario_id=pedido.usuario_id
                )
                self.db.add(movimiento)
        self.db.commit()
        return {"message": f"Pedido {estado}"}

    def eliminar_pedido(self, pedido_id: int):
        pedido = self.db.query(Pedido).filter(Pedido.id == pedido_id).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        # Devolver stock
        detalles = self.db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido_id).all()
        for det in detalles:
            movimiento = MovimientoInventario(
                producto_id=det.producto_id, tipo_movimiento=TipoMovimiento.ENTRADA,
                cantidad=det.cantidad, motivo=f"Eliminación {pedido.codigo}", usuario_id=pedido.usuario_id
            )
            self.db.add(movimiento)
        self.db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido_id).delete()
        self.db.delete(pedido)
        self.db.commit()

    def _formato_pedido(self, p):
        cliente = self.db.query(Cliente).filter(Cliente.id == p.cliente_id).first()
        detalles = self.db.query(DetallePedido).filter(DetallePedido.pedido_id == p.id).all()
        total = sum(float(d.subtotal or 0) for d in detalles)
        return {
            "id": p.id, "codigo": p.codigo, "cliente_id": p.cliente_id,
            "cliente_nombre": cliente.nombre if cliente else "Cliente eliminado",
            "fecha": p.created_at.isoformat() if p.created_at else None,
            "estado": p.estado, "notas": p.notas, "total": total, "items": len(detalles),
            "detalles": [{"id": d.id, "producto_id": d.producto_id, "producto_nombre": self.db.query(Producto).filter(Producto.id == d.producto_id).first().nombre if self.db.query(Producto).filter(Producto.id == d.producto_id).first() else "", "cantidad": float(d.cantidad), "precio_unitario": float(d.precio_unitario) if d.precio_unitario else 0, "subtotal": float(d.subtotal) if d.subtotal else 0} for d in detalles]
        }