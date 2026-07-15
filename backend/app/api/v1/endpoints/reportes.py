from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ....core.database import get_db
from ....services.reporte_service import ReporteService

router = APIRouter(prefix="/reportes", tags=["Reportes"])

@router.get("/inventario")
async def reporte_inventario(db: Session = Depends(get_db)):
    service = ReporteService(db)
    return service.inventario_valorizado()

@router.get("/ventas")
async def reporte_ventas(dias: int = Query(30), db: Session = Depends(get_db)):
    service = ReporteService(db)
    return service.ventas_por_periodo(dias)

@router.get("/movimientos")
async def reporte_movimientos(producto_id: Optional[int] = None, db: Session = Depends(get_db)):
    service = ReporteService(db)
    return service.movimientos_por_producto(producto_id)