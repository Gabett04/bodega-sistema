from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models.usuario import Usuario
from ..schemas.auth import LoginRequest, RegistroRequest
from ..core.security import security_manager

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def registrar_usuario(self, datos: RegistroRequest) -> Usuario:
        if self.db.query(Usuario).filter(Usuario.username == datos.username).first():
            raise HTTPException(status_code=400, detail="El usuario ya existe")
        if self.db.query(Usuario).filter(Usuario.email == datos.email).first():
            raise HTTPException(status_code=400, detail="El email ya esta registrado")
        usuario = Usuario(
            username=datos.username,
            password_hash=security_manager.hash_password(datos.password),
            nombre_completo=datos.nombre_completo,
            email=datos.email,
            rol=datos.rol or "bodeguero"
        )
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def login(self, datos: LoginRequest) -> dict:
        usuario = self.db.query(Usuario).filter(Usuario.username == datos.username).first()
        if not usuario or not security_manager.verify_password(datos.password, usuario.password_hash):
            raise HTTPException(status_code=401, detail="Usuario o contrasena incorrectos")
        if not usuario.activo:
            raise HTTPException(status_code=403, detail="Usuario desactivado")
        token_data = {"sub": str(usuario.id), "username": usuario.username, "role": usuario.rol}
        access_token = security_manager.create_access_token(data=token_data)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": usuario.id, "username": usuario.username, "nombre_completo": usuario.nombre_completo, "email": usuario.email, "rol": usuario.rol}
        }

    def obtener_todos_usuarios(self) -> list:
        return self.db.query(Usuario).all()

    def eliminar_usuario(self, user_id: int):
        usuario = self.db.query(Usuario).filter(Usuario.id == user_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        self.db.delete(usuario)
        self.db.commit()

    def toggle_activo(self, user_id: int) -> Usuario:
        usuario = self.db.query(Usuario).filter(Usuario.id == user_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        usuario.activo = not usuario.activo
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def crear_admin_default(self):
        if not self.db.query(Usuario).filter(Usuario.username == "admin").first():
            admin = Usuario(
                username="admin",
                password_hash=security_manager.hash_password("admin123"),
                nombre_completo="Administrador del Sistema",
                email="admin@bodega.com",
                rol="admin",
                activo=True
            )
            self.db.add(admin)
            self.db.commit()
            print("✅ Usuario admin creado: admin / admin123")