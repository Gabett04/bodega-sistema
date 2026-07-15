from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    productos = relationship("Producto", back_populates="categoria")

class UnidadMedida(Base):
    __tablename__ = "unidades_medida"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    abreviacion = Column(String(10), nullable=False)
    tipo = Column(String(20))
    productos = relationship("Producto", back_populates="unidad_base")

class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    unidad_base_id = Column(Integer, ForeignKey("unidades_medida.id"))
    precio_compra = Column(Numeric(10, 2), nullable=True)
    precio_venta = Column(Numeric(10, 2), nullable=True)
    stock_minimo = Column(Numeric(10, 3), default=0)
    stock_maximo = Column(Numeric(10, 3), nullable=True)
    perecedero = Column(Boolean, default=False)
    dias_vencimiento = Column(Integer, nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    categoria = relationship("Categoria", back_populates="productos")
    unidad_base = relationship("UnidadMedida", back_populates="productos")
    inventarios = relationship("Inventario", back_populates="producto")