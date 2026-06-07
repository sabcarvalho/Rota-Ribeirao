from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CriacaoLugarSchema(BaseModel):
    name: str
    street: str
    number: str
    district: str
    cep: str
    category: str
    occasion: str
    priceLevel: int
    rating: float
    description: str
    type: str
    image: Optional[str] = None
    eventStartDate: Optional[datetime] = None
    eventFinishDate: Optional[datetime] = None
    class Config:
        from_attributes = True

class LugarResponseSchema(BaseModel):
    id: int
    name: str = Field(validation_alias="nome")
    street: str = Field(validation_alias="rua")
    number: str = Field(validation_alias="numero_rua")
    district: str = Field(validation_alias="bairro")
    cep: str
    category: str = Field(validation_alias="categoria")
    occasion: str = Field(validation_alias="tags")
    priceLevel: int = Field(validation_alias="preco")
    rating: float = Field(validation_alias="nota")
    description: str = Field(validation_alias="descricao")
    type: str = Field(validation_alias="tipo")
    image: Optional[str] = Field(default=None, validation_alias="image_url")
    eventStartDate: Optional[datetime] = Field(default=None, validation_alias="data_inicio")
    eventFinishDate: Optional[datetime] = Field(default=None, validation_alias="data_fim")

    class Config:
        from_attributes = True