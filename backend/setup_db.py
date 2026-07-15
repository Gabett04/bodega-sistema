from app.core.database import init_db, SessionLocal
from app.models.producto import Categoria, UnidadMedida, Producto
from app.models.usuario import Usuario
from app.core.security import security_manager

print("🚀 Creando base de datos...")
init_db()

db = SessionLocal()

# Crear admin
admin = Usuario(
    username="admin",
    password_hash=security_manager.hash_password("admin123"),
    nombre_completo="Administrador",
    email="admin@bodega.com",
    rol="admin",
    activo=True
)
db.add(admin)

# Crear categorías
categorias_data = [
    ("Alimentos", "Productos alimenticios"),
    ("Bebidas", "Bebidas y licores"),
    ("Limpieza", "Artículos de limpieza"),
    ("Vestimenta", "Ropa y calzado"),
    ("Ferretería", "Herramientas"),
]
for nombre, desc in categorias_data:
    db.add(Categoria(nombre=nombre, descripcion=desc))

# Crear unidades
unidades_data = [
    ("Kilogramos", "kg", "peso"),
    ("Litros", "l", "volumen"),
    ("Unidades", "ud", "unidad"),
    ("Cajas", "cj", "paquete"),
    ("Metros", "m", "longitud"),
]
for nombre, abrev, tipo in unidades_data:
    db.add(UnidadMedida(nombre=nombre, abreviacion=abrev, tipo=tipo))

db.commit()

# Verificar
cats = db.query(Categoria).all()
unids = db.query(UnidadMedida).all()

print(f"\n✅ Categorías creadas: {len(cats)}")
for c in cats:
    print(f"  {c.id}: {c.nombre}")

print(f"\n✅ Unidades creadas: {len(unids)}")
for u in unids:
    print(f"  {u.id}: {u.nombre} ({u.abreviacion})")

db.close()
print("\n✅ LISTO!")