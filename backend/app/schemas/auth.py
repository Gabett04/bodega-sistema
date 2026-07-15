from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class RegistroRequest(BaseModel):
    username: str
    password: str
    nombre_completo: str
    email: EmailStr
    rol: Optional[str] = "bodeguero"