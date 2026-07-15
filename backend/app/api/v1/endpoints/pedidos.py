from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.security import get_current_active_user
from ....core.permissions import Permissions
from ....schemas.cliente import ClienteCreate, PedidoCreate
from ....services.pedido_service import PedidoService

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

# ==================== CLIENTES ====================
@router.get("/clientes")
async def listar_clientes(db: Session = Depends(get_db)):
    service = PedidoService(db)
    return service.obtener_clientes()

@router.post("/clientes")
async def crear_cliente(
    datos: ClienteCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Todos los usuarios autenticados pueden crear clientes"""
    service = PedidoService(db)
    return service.crear_cliente(datos)

@router.put("/clientes/{cliente_id}")
async def actualizar_cliente(
    cliente_id: int,
    datos: ClienteCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Solo admin puede modificar clientes"""
    if not Permissions.check(current_user.get("role"), "clientes", "editar"):
        raise HTTPException(status_code=403, detail="Solo administradores pueden modificar clientes")
    service = PedidoService(db)
    return service.actualizar_cliente(cliente_id, datos)

@router.delete("/clientes/{cliente_id}")
async def eliminar_cliente(
    cliente_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Solo admin puede eliminar clientes"""
    if not Permissions.check(current_user.get("role"), "clientes", "eliminar"):
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar clientes")
    service = PedidoService(db)
    service.eliminar_cliente(cliente_id)
    return {"message": "Cliente eliminado"}

# ==================== PEDIDOS ====================
@router.get("")
async def listar_pedidos(db: Session = Depends(get_db)):
    service = PedidoService(db)
    return service.obtener_pedidos()

@router.post("")
async def crear_pedido(
    datos: PedidoCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Todos pueden crear pedidos"""
    service = PedidoService(db)
    return service.crear_pedido(datos, int(current_user.get("user_id")))

@router.put("/{pedido_id}")
async def actualizar_pedido(
    pedido_id: int,
    datos: PedidoCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Todos pueden modificar pedidos"""
    service = PedidoService(db)
    return service.actualizar_pedido(pedido_id, datos)

@router.put("/{pedido_id}/estado")
async def cambiar_estado(
    pedido_id: int,
    estado: str,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Todos pueden cambiar estado"""
    service = PedidoService(db)
    return service.cambiar_estado(pedido_id, estado)

@router.delete("/{pedido_id}")
async def eliminar_pedido(
    pedido_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Solo admin puede eliminar pedidos"""
    if not Permissions.check(current_user.get("role"), "pedidos", "eliminar"):
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar pedidos")
    service = PedidoService(db)
    service.eliminar_pedido(pedido_id)
    return {"message": "Pedido eliminado"}