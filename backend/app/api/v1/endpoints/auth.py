from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....core.security import get_current_active_user
from ....core.permissions import Permissions
from ....schemas.auth import LoginRequest, RegistroRequest
from ....services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

@router.post("/login")
async def login(datos: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.login(datos)

@router.post("/registro")
async def registro(datos: RegistroRequest, current_user: dict = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if not Permissions.check(current_user.get("role"), "usuarios", "crear"):
        raise HTTPException(status_code=403, detail="No tienes permiso para crear usuarios")
    auth_service = AuthService(db)
    usuario = auth_service.registrar_usuario(datos)
    return {"message": "Usuario creado exitosamente", "user": {"id": usuario.id, "username": usuario.username, "nombre_completo": usuario.nombre_completo, "email": usuario.email, "rol": usuario.rol}}

@router.get("/me")
async def perfil(current_user: dict = Depends(get_current_active_user)):
    return current_user

@router.get("/usuarios")
async def listar_usuarios(current_user: dict = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if not Permissions.check(current_user.get("role"), "usuarios", "ver"):
        raise HTTPException(status_code=403, detail="Solo admin y supervisor pueden ver usuarios")
    auth_service = AuthService(db)
    usuarios = auth_service.obtener_todos_usuarios()
    return [{"id": u.id, "username": u.username, "nombre_completo": u.nombre_completo, "email": u.email, "rol": u.rol, "activo": u.activo, "created_at": u.created_at.isoformat() if u.created_at else None} for u in usuarios]

@router.delete("/usuarios/{user_id}")
async def eliminar_usuario(user_id: int, current_user: dict = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if not Permissions.check(current_user.get("role"), "usuarios", "eliminar"):
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar usuarios")
    if str(user_id) == current_user.get("user_id"):
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
    auth_service = AuthService(db)
    auth_service.eliminar_usuario(user_id)
    return {"message": "Usuario eliminado"}

@router.put("/usuarios/{user_id}/toggle")
async def toggle_usuario(user_id: int, current_user: dict = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if not Permissions.check(current_user.get("role"), "usuarios", "editar"):
        raise HTTPException(status_code=403, detail="No tienes permiso")
    if str(user_id) == current_user.get("user_id"):
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")
    auth_service = AuthService(db)
    usuario = auth_service.toggle_activo(user_id)
    return {"message": f"Usuario {'activado' if usuario.activo else 'desactivado'}", "activo": usuario.activo}