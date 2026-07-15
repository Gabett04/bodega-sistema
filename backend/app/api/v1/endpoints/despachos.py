from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ....core.database import get_db
from ....core.security import get_current_active_user
from ....services.despacho_service import DespachoService

router = APIRouter(prefix="/despachos", tags=["Despachos"])

class DespachoCreate(BaseModel):
    transportista: Optional[str] = ""
    vehiculo_placa: Optional[str] = ""
    direccion_entrega: Optional[str] = ""
    observaciones: Optional[str] = ""

@router.get("")
async def listar_despachos(db: Session = Depends(get_db)):
    service = DespachoService(db)
    return service.obtener_despachos()

@router.post("/{pedido_id}")
async def crear_despacho(
    pedido_id: int,
    datos: DespachoCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DespachoService(db)
    return service.crear_despacho(pedido_id, int(current_user.get("user_id")), datos.model_dump())

@router.put("/{despacho_id}/estado")
async def cambiar_estado(
    despacho_id: int,
    estado: str,
    db: Session = Depends(get_db)
):
    service = DespachoService(db)
    return service.cambiar_estado(despacho_id, estado)

@router.delete("/{despacho_id}")
async def eliminar_despacho(
    despacho_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar despachos")
    service = DespachoService(db)
    service.eliminar_despacho(despacho_id)
    return {"message": "Despacho eliminado"}