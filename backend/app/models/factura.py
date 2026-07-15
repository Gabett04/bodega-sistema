from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Factura(Base):
    __tablename__ = "facturas"
    id = Column(Integer, primary_key=True, index=True)
    numero_factura = Column(String(50), unique=True, nullable=False, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    fecha_emision = Column(DateTime(timezone=True), server_default=func.now())
    subtotal = Column(Numeric(12, 2), default=0)
    igv = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    estado_pago = Column(String(20), default="pendiente")
    metodo_pago = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    detalles = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")

class DetalleFactura(Base):
    __tablename__ = "detalle_factura"
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Numeric(10, 3), nullable=False)
    precio_unitario = Column(Numeric(10, 2))
    subtotal = Column(Numeric(10, 2))
    factura = relationship("Factura", back_populates="detalles")