from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
from ..models.producto import Producto, Categoria, UnidadMedida
from ..models.inventario import Inventario, MovimientoInventario, TipoMovimiento
from ..schemas.producto import ProductoCreate

class InventarioService:
    def __init__(self, db: Session):
        self.db = db

    # ==================== CATEGORIAS ====================
    def crear_categoria(self, nombre: str, descripcion: str = None):
        if self.db.query(Categoria).filter(Categoria.nombre == nombre).first():
            raise HTTPException(status_code=400, detail="La categoria ya existe")
        categoria = Categoria(nombre=nombre, descripcion=descripcion)
        self.db.add(categoria)
        self.db.commit()
        self.db.refresh(categoria)
        return {"id": categoria.id, "nombre": categoria.nombre, "descripcion": categoria.descripcion}

    def obtener_categorias(self):
        return [{"id": c.id, "nombre": c.nombre, "descripcion": c.descripcion} for c in self.db.query(Categoria).filter(Categoria.activo == True).all()]

    def actualizar_categoria(self, categoria_id: int, nombre: str, descripcion: str = None):
        categoria = self.db.query(Categoria).filter(Categoria.id == categoria_id).first()
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        categoria.nombre = nombre
        categoria.descripcion = descripcion
        self.db.commit()
        return {"id": categoria.id, "nombre": categoria.nombre, "descripcion": categoria.descripcion}

    def eliminar_categoria(self, categoria_id: int):
        categoria = self.db.query(Categoria).filter(Categoria.id == categoria_id).first()
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        categoria.activo = False
        self.db.commit()

    # ==================== UNIDADES ====================
    def crear_unidad(self, nombre: str, abreviacion: str, tipo: str = None):
        unidad = UnidadMedida(nombre=nombre, abreviacion=abreviacion, tipo=tipo)
        self.db.add(unidad)
        self.db.commit()
        self.db.refresh(unidad)
        return {"id": unidad.id, "nombre": unidad.nombre, "abreviacion": unidad.abreviacion, "tipo": unidad.tipo}

    def obtener_unidades(self):
        return [{"id": u.id, "nombre": u.nombre, "abreviacion": u.abreviacion, "tipo": u.tipo} for u in self.db.query(UnidadMedida).all()]

    def actualizar_unidad(self, unidad_id: int, nombre: str, abreviacion: str, tipo: str = None):
        unidad = self.db.query(UnidadMedida).filter(UnidadMedida.id == unidad_id).first()
        if not unidad:
            raise HTTPException(status_code=404, detail="Unidad no encontrada")
        unidad.nombre = nombre
        unidad.abreviacion = abreviacion
        unidad.tipo = tipo
        self.db.commit()
        return {"id": unidad.id, "nombre": unidad.nombre, "abreviacion": unidad.abreviacion, "tipo": unidad.tipo}

    def eliminar_unidad(self, unidad_id: int):
        unidad = self.db.query(UnidadMedida).filter(UnidadMedida.id == unidad_id).first()
        if not unidad:
            raise HTTPException(status_code=404, detail="Unidad no encontrada")
        self.db.delete(unidad)
        self.db.commit()

    # ==================== PRODUCTOS ====================
    def crear_producto(self, datos: ProductoCreate):
        if self.db.query(Producto).filter(Producto.codigo == datos.codigo).first():
            raise HTTPException(status_code=400, detail="El codigo ya existe")
        producto = Producto(**datos.model_dump())
        self.db.add(producto)
        self.db.commit()
        self.db.refresh(producto)
        return self._formato_producto(producto)

    def obtener_productos(self):
        return [self._formato_producto(p) for p in self.db.query(Producto).filter(Producto.activo == True).all()]

    def obtener_producto(self, producto_id: int):
        p = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return self._formato_producto(p)

    def actualizar_producto(self, producto_id: int, datos: ProductoCreate):
        p = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        p.codigo = datos.codigo
        p.nombre = datos.nombre
        p.descripcion = datos.descripcion
        p.categoria_id = datos.categoria_id
        p.unidad_base_id = datos.unidad_base_id
        p.precio_compra = datos.precio_compra
        p.precio_venta = datos.precio_venta
        p.stock_minimo = datos.stock_minimo
        p.perecedero = datos.perecedero
        p.dias_vencimiento = datos.dias_vencimiento
        self.db.commit()
        self.db.refresh(p)
        return self._formato_producto(p)

    def eliminar_producto(self, producto_id: int):
        p = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        p.activo = False
        self.db.commit()

    def _formato_producto(self, p):
        return {
            "id": p.id, "codigo": p.codigo, "nombre": p.nombre,
            "descripcion": p.descripcion, "categoria_id": p.categoria_id,
            "unidad_base_id": p.unidad_base_id,
            "precio_compra": float(p.precio_compra) if p.precio_compra else None,
            "precio_venta": float(p.precio_venta) if p.precio_venta else None,
            "stock_minimo": float(p.stock_minimo) if p.stock_minimo else 0,
            "perecedero": p.perecedero, "dias_vencimiento": p.dias_vencimiento,
            "activo": p.activo,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }

    # ==================== MOVIMIENTOS ====================
    def registrar_movimiento(self, producto_id: int, tipo: str, cantidad: Decimal,
                            usuario_id: int, lote: str = None, motivo: str = None,
                            ubicacion_id: int = None):
        p = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        if not ubicacion_id:
            ubicacion_id = 1
        if tipo in ['salida', 'merma']:
            stock = self.obtener_stock_producto(producto_id)
            if stock < cantidad:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente. Actual: {stock}")
        movimiento = MovimientoInventario(
            producto_id=producto_id, tipo_movimiento=TipoMovimiento(tipo),
            cantidad=cantidad, unidad_id=p.unidad_base_id,
            ubicacion_destino_id=ubicacion_id if tipo in ['entrada', 'ajuste'] else None,
            ubicacion_origen_id=ubicacion_id if tipo in ['salida', 'merma'] else None,
            lote=lote, motivo=motivo, usuario_id=usuario_id
        )
        self.db.add(movimiento)
        self.db.commit()
        self.db.refresh(movimiento)
        return {"message": "Movimiento registrado", "id": movimiento.id}

    def obtener_movimientos(self):
        movimientos = self.db.query(MovimientoInventario).order_by(MovimientoInventario.created_at.desc()).limit(200).all()
        return [self._formato_movimiento(m) for m in movimientos]

    def obtener_movimientos_producto(self, producto_id: int):
        movimientos = self.db.query(MovimientoInventario).filter(MovimientoInventario.producto_id == producto_id).order_by(MovimientoInventario.created_at.desc()).all()
        return [self._formato_movimiento(m) for m in movimientos]

    def eliminar_movimiento(self, movimiento_id: int):
        movimiento = self.db.query(MovimientoInventario).filter(MovimientoInventario.id == movimiento_id).first()
        if not movimiento:
            raise HTTPException(status_code=404, detail="Movimiento no encontrado")
        self.db.delete(movimiento)
        self.db.commit()

    def _formato_movimiento(self, m):
        return {
            "id": m.id, "producto_id": m.producto_id,
            "tipo_movimiento": m.tipo_movimiento.value if m.tipo_movimiento else None,
            "cantidad": float(m.cantidad), "lote": m.lote, "motivo": m.motivo,
            "usuario_id": m.usuario_id,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }

    def obtener_stock_producto(self, producto_id: int) -> Decimal:
        movimientos = self.db.query(MovimientoInventario).filter(MovimientoInventario.producto_id == producto_id).all()
        stock = Decimal('0')
        for m in movimientos:
            if m.tipo_movimiento in [TipoMovimiento.ENTRADA, TipoMovimiento.AJUSTE]:
                stock += m.cantidad
            else:
                stock -= m.cantidad
        return stock

    def obtener_stock_actual(self):
        productos = self.db.query(Producto).filter(Producto.activo == True).all()
        resultado = []
        for p in productos:
            stock = self.obtener_stock_producto(p.id)
            cat = self.db.query(Categoria).filter(Categoria.id == p.categoria_id).first()
            unidad = self.db.query(UnidadMedida).filter(UnidadMedida.id == p.unidad_base_id).first()
            estado = 'normal'
            if stock <= 0: estado = 'agotado'
            elif stock <= (p.stock_minimo or 0): estado = 'critico'
            resultado.append({
                "producto_id": p.id, "codigo": p.codigo, "nombre": p.nombre,
                "categoria": cat.nombre if cat else '',
                "stock_actual": float(stock),
                "unidad": unidad.abreviacion if unidad else '',
                "stock_minimo": float(p.stock_minimo or 0), "estado": estado
            })
        return resultado

    # ==================== DATOS INICIALES ====================
    def crear_datos_iniciales(self):
        if not self.db.query(Categoria).first():
            for cat in ["Alimentos", "Bebidas", "Limpieza", "Vestimenta", "Ferretería"]:
                self.db.add(Categoria(nombre=cat))
        if not self.db.query(UnidadMedida).first():
            unidades = [
                ("Kilogramos", "kg", "peso"), ("Litros", "l", "volumen"),
                ("Unidades", "ud", "unidad"), ("Cajas", "cj", "paquete"),
                ("Metros", "m", "longitud"),
            ]
            for nombre, abrev, tipo in unidades:
                self.db.add(UnidadMedida(nombre=nombre, abreviacion=abrev, tipo=tipo))
        self.db.commit()
        print("✅ Datos iniciales creados")