class Permissions:
    ROLES = {
        "admin": {
            "usuarios": ["crear", "ver", "editar", "eliminar"],
            "productos": ["crear", "ver", "editar", "eliminar"],
            "inventario": ["ver", "entrada", "salida", "transferencia", "ajuste"],
            "pedidos": ["crear", "ver", "editar", "cancelar", "eliminar"],
            "despachos": ["crear", "ver", "procesar"],
            "facturacion": ["crear", "ver", "anular"],
            "clientes": ["crear", "ver", "editar", "eliminar"],
            "reportes": ["stock", "financieros", "movimientos"],
        },
        "supervisor": {
            "usuarios": ["ver"],
            "productos": ["ver"],
            "inventario": ["ver"],
            "pedidos": ["ver"],
            "despachos": ["ver"],
            "facturacion": ["ver"],
            "clientes": ["ver"],
            "reportes": ["stock", "movimientos"],
        },
        "bodeguero": {
            "productos": ["crear", "ver", "editar"],
            "inventario": ["ver", "entrada", "salida", "transferencia"],
            "pedidos": ["ver", "preparar"],
            "despachos": ["ver"],
        },
        "despachador": {
            "productos": ["ver"],
            "inventario": ["ver"],
            "pedidos": ["ver"],
            "despachos": ["ver", "procesar"],
        },
        "vendedor": {
            "productos": ["ver"],
            "inventario": ["ver"],
            "pedidos": ["crear", "ver"],
            "clientes": ["ver"],
        },
    }

    @classmethod
    def check(cls, role: str, module: str, action: str) -> bool:
        if role not in cls.ROLES:
            return False
        if module not in cls.ROLES[role]:
            return False
        return action in cls.ROLES[role][module]