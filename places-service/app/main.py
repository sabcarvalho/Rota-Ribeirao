from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests
import os
from pathlib import Path
from app.models import Lugar, Evento
from app.schemas import CriacaoLugarSchema, LugarResponseSchema

app = FastAPI()

env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES= int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

FRONTEND_ORIGIN = os.getenv("FRONT_END_URL", "http://localhost:3000")
ADMIN_MODULE_URL = os.getenv("ADMIN_SERVICE_URL")

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

brcypt_context = CryptContext(schemes = ["argon2"], deprecated = "auto")
oauth2_schema = OAuth2PasswordBearer(tokenUrl="auth/login-form")

from app.dependencies import get_session, verificar_admin
from sqlalchemy import func

@app.get("/search_place", response_model=list[LugarResponseSchema])
def get_places(
    name: str | None = None,
    category: str | None = None,
    occasion: str | None = None,
    price_level: int | None = None,
    min_rating: int | None = None,
    event_type: str | None = None,
    session: Session = Depends(get_session)
):
    lugar_query = session.query(Lugar)

    if name:
        lugar_query = lugar_query.filter(
            Lugar.nome.ilike(f"%{name}%")
        )

    if event_type:
        lugar_query = lugar_query.filter(
            func.lower(Lugar.tipo)
            == event_type.lower()
        )

    if category:
        lugar_query = lugar_query.filter(
            func.lower(Lugar.categoria)
            == category.lower()
        )

    if occasion:
        lugar_query = lugar_query.filter(
            Lugar.tags.ilike(f"%{occasion}%")
        )
    
    if price_level:
        lugar_query = lugar_query.filter(
            Lugar.preco <= price_level
        )
    
    if min_rating:
        lugar_query = lugar_query.filter(
            Lugar.nota >= min_rating
        )

    return lugar_query.all()


@app.post("/add_place", response_model=LugarResponseSchema)
def create_place(lugar_schema: CriacaoLugarSchema, session: Session = Depends(get_session), 
                 usuario: dict = Depends(verificar_admin)):
    db_place = Lugar(nome=lugar_schema.name, rua=lugar_schema.street, numero_rua=lugar_schema.number,
                        bairro=lugar_schema.district, cep=lugar_schema.cep,categoria= lugar_schema.category.lower(),
                        tags= lugar_schema.occasion.lower(), preco=lugar_schema.priceLevel, nota=lugar_schema.rating,
                        descricao=lugar_schema.description,tipo= lugar_schema.type, image_url=lugar_schema.image)
    session.add(db_place)
    session.flush()
    if lugar_schema.type == "evento":
        db_event = Evento(
            id = db_place.id,
            data_inicio = lugar_schema.eventStartDate,
            data_fim = lugar_schema.eventFinishDate,
            tipo="evento"
        )
        session.add(db_event)

    
    session.commit()
    session.refresh(db_place)

    return db_place


@app.get("/search_place/", response_model=list[LugarResponseSchema])
async def get_places(ids: list[int] = Query(...), session: Session = Depends(get_session)):
    lugares = session.query(Lugar).filter(Lugar.id.in_(ids)).all()
    
    return lugares

@app.delete("/delete_place/{id_place}") 
def delete_favorite(id_place: int, request: Request, usuario: dict = Depends(verificar_admin), session: Session = Depends(get_session)):
    lugar = session.query(Lugar).filter(Lugar.id == id_place).first()

    if not lugar:
        raise HTTPException(status_code=404, detail="Lugar não encontrado")
    
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(status_code=401, detail="Token de autorização ausente")

    headers_internos = {
        "Authorization": auth_header 
    }
    try:
        if lugar.tipo == "evento":
            evento = session.query(Evento).filter(Evento.id == id_place).first()
            if evento:
                session.delete(evento)

        session.delete(lugar)
        session.flush() 
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, 
                            detail=f"Erro interno ao tentar deletar no banco local: {str(e)}")

    try:
        url_limpa = f"{ADMIN_MODULE_URL.rstrip('/')}/places/delete_favorite/place/all/{id_place}"
        response = requests.delete(url_limpa, headers=headers_internos)
        
        if response.status_code == 200:
            session.commit()
            return {"detail": "Lugar e favoritos removidos com sucesso"}
            
        else:
            session.rollback()
            raise HTTPException(status_code=response.status_code, 
                                detail="Não foi possível sincronizar a remoção de favoritos nos outros módulos")
            
    except requests.exceptions.RequestException as e:
        session.rollback()
        # Logue o erro real no terminal do Docker para ver o diagnóstico exato (Timeout, Connection Refused, etc.)
        print(f"ERRO REAL DE CONEXÃO: {e}")
        raise HTTPException(status_code=503, 
                            detail="Módulo de administração indisponível. Operação cancelada por segurança.")
    
    

