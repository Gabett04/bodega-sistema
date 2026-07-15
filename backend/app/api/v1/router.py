from fastapi import APIRouter
from .endpoints import auth, inventario, pedidos, despachos, facturacion, reportes

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(inventario.router)
api_router.include_router(pedidos.router)
api_router.include_router(despachos.router)
api_router.include_router(facturacion.router)
api_router.include_router(reportes.router)