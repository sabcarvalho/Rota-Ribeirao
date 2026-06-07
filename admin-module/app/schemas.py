from pydantic import BaseModel, EmailStr
from typing import Optional

class UsuarioSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    active: Optional[bool] = True
    
    class Config:
        from_attributes = True

class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    class Config:
        from_attributes = True

class RefreshTokenSchema(BaseModel):
    refresh_token: str
    class Config:
        from_attributes = True