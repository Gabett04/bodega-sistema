from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class UnidadMedidaCreate(BaseModel):
    nombre: str
    abreviacion: str
    tipo: Optional[str] = None

class ProductoCreate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    categoria_id: int
    unidad_base_id: int
    precio_compra: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    stock_minimo: Optional[Decimal] = 0
    perecedero: Optional[bool] = False
    dias_vencimiento: Optional[int] = None

class MovimientoStock(BaseModel):
    tipo: str
    cantidad: Decimal
    lote: Optional[str] = None
    motivo: Optional[str] = None
    ubicacion_id: Optional[int] = None