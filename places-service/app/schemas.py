from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CriacaoLugarSchema(BaseModel):
    nome: str
    rua: str
    numero_rua: str
    bairro: str
    cep: str
    categoria: str
    tags: str
    preco: int
    nota: float
    descricao: str
    tipo: str
    image_url: Optional[str]
    data_inicio: Optional[datetime]
    data_fim: Optional[datetime]
    class Config:
        from_attributes = True

class LugarResponseSchema(BaseModel):
    id: int
    nome: str
    rua: str
    numero_rua: str
    bairro: str
    cep: str
    categoria: str
    tags: str
    preco: int
    nota: float
    descricao: str
    tipo: str
    image_url: Optional[str] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None

    class Config:
        from_attributes = True