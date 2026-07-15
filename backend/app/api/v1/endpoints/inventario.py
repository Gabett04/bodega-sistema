from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.security import get_current_active_user
from ....core.permissions import Permissions
from ....schemas.producto import ProductoCreate, CategoriaCreate, UnidadMedidaCreate, MovimientoStock
from ....services.inventario_service import InventarioService

router = APIRouter(prefix="/inventario", tags=["Inventario"])

# ==================== CATEGORIAS ====================
@router.get("/categorias")
async def listar_categorias(db: Session = Depends(get_db)):
    service = InventarioService(db)
    return service.obtener_categorias()

@router.post("/categorias")
async def crear_categoria(
    datos: CategoriaCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "crear"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    return service.crear_categoria(datos.nombre, datos.descripcion)

@router.put("/categorias/{categoria_id}")
async def actualizar_categoria(
    categoria_id: int,
    datos: CategoriaCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "editar"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    return service.actualizar_categoria(categoria_id, datos.nombre, datos.descripcion)

@router.delete("/categorias/{categoria_id}")
async def eliminar_categoria(
    categoria_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "eliminar"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    service.eliminar_categoria(categoria_id)
    return {"message": "Categoría eliminada"}

# ==================== UNIDADES ====================
@router.get("/unidades")
async def listar_unidades(db: Session = Depends(get_db)):
    service = InventarioService(db)
    return service.obtener_unidades()

@router.post("/unidades")
async def crear_unidad(
    datos: UnidadMedidaCreate,
    db: Session = Depends(get_db)
):
    service = InventarioService(db)
    return service.crear_unidad(datos.nombre, datos.abreviacion, datos.tipo)

@router.put("/unidades/{unidad_id}")
async def actualizar_unidad(
    unidad_id: int,
    datos: UnidadMedidaCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "editar"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    return service.actualizar_unidad(unidad_id, datos.nombre, datos.abreviacion, datos.tipo)

@router.delete("/unidades/{unidad_id}")
async def eliminar_unidad(
    unidad_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "eliminar"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    service.eliminar_unidad(unidad_id)
    return {"message": "Unidad eliminada"}

# ==================== PRODUCTOS ====================
@router.get("/productos")
async def listar_productos(db: Session = Depends(get_db)):
    service = InventarioService(db)
    return service.obtener_productos()

@router.post("/productos")
async def crear_producto(
    datos: ProductoCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "crear"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    return service.crear_producto(datos)

@router.get("/productos/{producto_id}")
async def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    service = InventarioService(db)
    return service.obtener_producto(producto_id)

@router.put("/productos/{producto_id}")
async def actualizar_producto(
    producto_id: int,
    datos: ProductoCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "editar"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    return service.actualizar_producto(producto_id, datos)

@router.delete("/productos/{producto_id}")
async def eliminar_producto(
    producto_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "productos", "eliminar"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    service.eliminar_producto(producto_id)
    return {"message": "Producto eliminado"}

# ==================== MOVIMIENTOS ====================
@router.get("/movimientos")
async def listar_movimientos(db: Session = Depends(get_db)):
    service = InventarioService(db)
    return service.obtener_movimientos()

@router.post("/productos/{producto_id}/movimiento")
async def registrar_movimiento(
    producto_id: int,
    datos: MovimientoStock,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "inventario", datos.tipo):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    return service.registrar_movimiento(
        producto_id=producto_id, tipo=datos.tipo, cantidad=datos.cantidad,
        usuario_id=int(current_user.get("user_id")), lote=datos.lote,
        motivo=datos.motivo, ubicacion_id=datos.ubicacion_id
    )

@router.get("/productos/{producto_id}/movimientos")
async def movimientos_producto(producto_id: int, db: Session = Depends(get_db)):
    service = InventarioService(db)
    return service.obtener_movimientos_producto(producto_id)

@router.delete("/movimientos/{movimiento_id}")
async def eliminar_movimiento(
    movimiento_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not Permissions.check(current_user.get("role"), "inventario", "ajuste"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    service = InventarioService(db)
    service.eliminar_movimiento(movimiento_id)
    return {"message": "Movimiento eliminado"}

@router.get("/stock")
async def ver_stock(db: Session = Depends(get_db)):
    service = InventarioService(db)
    return service.obtener_stock_actual()