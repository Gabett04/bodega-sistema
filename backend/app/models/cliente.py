from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text
from sqlalchemy.sql import func
from ..core.database import Base

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, index=True)
    nombre = Column(String(200), nullable=False)
    tipo_documento = Column(String(10))
    numero_documento = Column(String(20))
    direccion = Column(Text)
    telefono = Column(String(20))
    email = Column(String(100))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())