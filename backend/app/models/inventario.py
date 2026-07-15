from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum

class TipoMovimiento(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    TRANSFERENCIA = "transferencia"
    AJUSTE = "ajuste"
    MERMA = "merma"

class Inventario(Base):
    __tablename__ = "inventario"
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    ubicacion_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=False)
    lote = Column(String(50))
    fecha_vencimiento = Column(DateTime)
    cantidad = Column(Numeric(10, 3), nullable=False, default=0)
    unidad_id = Column(Integer, ForeignKey("unidades_medida.id"))
    costo_unitario = Column(Numeric(10, 4))
    fecha_ingreso = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    producto = relationship("Producto", back_populates="inventarios")
    ubicacion = relationship("Ubicacion", back_populates="inventarios")

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    tipo_movimiento = Column(Enum(TipoMovimiento), nullable=False)
    cantidad = Column(Numeric(10, 3), nullable=False)
    unidad_id = Column(Integer, ForeignKey("unidades_medida.id"))
    ubicacion_origen_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=True)
    ubicacion_destino_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=True)
    lote = Column(String(50))
    documento_referencia = Column(String(100))
    motivo = Column(String(255))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())