from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal

class ClienteCreate(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

class DetallePedidoCreate(BaseModel):
    producto_id: int
    cantidad: Decimal
    precio_unitario: Optional[Decimal] = None

class PedidoCreate(BaseModel):
    codigo: Optional[str] = None
    cliente_id: int
    notas: Optional[str] = None
    detalles: List[DetallePedidoCreate]