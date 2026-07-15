from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Bodega(Base):
    __tablename__ = "bodegas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(255))
    tipo = Column(String(20), default="principal")
    activa = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ubicaciones = relationship("Ubicacion", back_populates="bodega")

class Ubicacion(Base):
    __tablename__ = "ubicaciones"
    id = Column(Integer, primary_key=True, index=True)
    bodega_id = Column(Integer, ForeignKey("bodegas.id"), nullable=False)
    zona = Column(String(50))
    pasillo = Column(String(10))
    rack = Column(String(10))
    nivel = Column(Integer)
    codigo_ubicacion = Column(String(50), unique=True, nullable=False)
    capacidad_maxima = Column(Numeric(10, 3), nullable=True)
    activa = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    bodega = relationship("Bodega", back_populates="ubicaciones")
    inventarios = relationship("Inventario", back_populates="ubicacion")