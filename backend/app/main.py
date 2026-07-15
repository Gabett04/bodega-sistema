from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .core.config import settings
from .core.database import init_db, SessionLocal
from .services.auth_service import AuthService
from .services.inventario_service import InventarioService
from .models import Usuario, Producto, Categoria, UnidadMedida, Inventario, MovimientoInventario, Bodega, Ubicacion, Cliente, Pedido, DetallePedido, Despacho, Factura, DetalleFactura
from .api.v1.router import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    print("🚀 Iniciando...")
    try:
        init_db()
        db = SessionLocal()
        AuthService(db).crear_admin_default()
        InventarioService(db).crear_datos_iniciales()
        db.close()
        print("✅ Listo")
    except Exception as e:
        print(f"Error: {e}")

@app.get("/init")
async def init_data():
    try:
        db = SessionLocal()
        AuthService(db).crear_admin_default()
        InventarioService(db).crear_datos_iniciales()
        db.close()
        return {"message": "Datos creados", "admin": "admin", "password": "admin123"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "API online", "docs": "/api/docs"}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}