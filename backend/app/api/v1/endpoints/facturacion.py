from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.security import get_current_active_user
from ....services.factura_service import FacturaService

router = APIRouter(prefix="/facturas", tags=["Facturación"])

@router.get("")
async def listar_facturas(db: Session = Depends(get_db)):
    service = FacturaService(db)
    return service.obtener_facturas()

@router.post("/{pedido_id}")
async def crear_factura(pedido_id: int, db: Session = Depends(get_db)):
    service = FacturaService(db)
    return service.crear_factura(pedido_id)

@router.put("/{factura_id}/pago")
async def cambiar_pago(factura_id: int, estado: str, db: Session = Depends(get_db)):
    service = FacturaService(db)
    return service.cambiar_estado_pago(factura_id, estado)

@router.delete("/{factura_id}")
async def eliminar_factura(
    factura_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar facturas")
    service = FacturaService(db)
    service.eliminar_factura(factura_id)
    return {"message": "Factura eliminada"}