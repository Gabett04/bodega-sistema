from datetime import datetime, timedelta
from typing import Dict, Optional
from jose import JWTError, jwt
import hashlib
import os
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

security_scheme = HTTPBearer()

class SecurityManager:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM

    def hash_password(self, password: str) -> str:
        salt = os.urandom(32)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return salt.hex() + '.' + key.hex()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        salt_hex, key_hex = hashed_password.split('.')
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return key == new_key

    def create_access_token(self, data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire, "iat": datetime.utcnow()})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Dict:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except JWTError:
            raise HTTPException(status_code=401, detail="Token invalido")

    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> Dict:
        payload = self.verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalido")
        return {"user_id": user_id, "username": payload.get("username", ""), "role": payload.get("role", "user")}

security_manager = SecurityManager()

def get_current_active_user(current_user: Dict = Depends(security_manager.get_current_user)) -> Dict:
    return current_user