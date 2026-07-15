from app.core.database import init_db, SessionLocal
from app.models.usuario import Usuario
from app.core.security import security_manager

print("🚀 Inicializando base de datos...")

# Crear tablas
init_db()

# Crear sesión
db = SessionLocal()

# Verificar si existe admin
admin = db.query(Usuario).filter(Usuario.username == "admin").first()

if admin:
    print(f"Usuario admin ya existe: {admin.username}")
    # Actualizar contraseña
    admin.password_hash = security_manager.hash_password("admin123")
    db.commit()
    print("✅ Contraseña actualizada")
else:
    # Crear admin
    admin = Usuario(
        username="admin",
        password_hash=security_manager.hash_password("admin123"),
        nombre_completo="Administrador del Sistema",
        email="admin@bodega.com",
        rol="admin",
        activo=True
    )
    db.add(admin)
    db.commit()
    print("✅ Usuario admin creado")

# Verificar
admin = db.query(Usuario).filter(Usuario.username == "admin").first()
print(f"Usuario: {admin.username}")
print(f"Email: {admin.email}")
print(f"Rol: {admin.rol}")
print(f"Activo: {admin.activo}")

# Verificar contraseña
test = security_manager.verify_password("admin123", admin.password_hash)
print(f"Contraseña válida: {test}")

db.close()
print("✅ Listo!")