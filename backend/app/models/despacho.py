from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Despacho(Base):
    __tablename__ = "despachos"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    fecha_despacho = Column(DateTime(timezone=True), server_default=func.now())
    estado = Column(String(20), default="preparado")
    transportista = Column(String(200))
    vehiculo_placa = Column(String(20))
    direccion_entrega = Column(Text)
    observaciones = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())