from fastapi import FastAPI, Depends, HTTPException, Query, Request, status
from app.schemas import CriacaoLugarSchema, LugarResponseSchema, UpdateRatingSchema
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload, selectinload
from passlib.context import CryptContext
from app.models import Lugar, Evento
from sqlalchemy import func, or_
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
import requests
import os

app = FastAPI()

#definicao do caminho das variaveis de ambiente quando se roda localmente
env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv() #quando rodado em docker, vem automaticamente pelo .env da pasta raiz

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES= int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

FRONTEND_ORIGIN = os.getenv("FRONT_END_URL", "http://localhost:3000").rstrip('/')
ADMIN_MODULE_URL = os.getenv("ADMIN_SERVICE_URL").rstrip('/')
REVIEW_SERVICE_URL = os.getenv("REVIEW_SERVICE_URL").rstrip('/')

#configurando o CORS para apenas aceitar o frontend
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

@app.get("/admin/places", response_model=list[LugarResponseSchema])
async def get_admin_places(session: Session = Depends(get_session),usuario: dict = Depends(verificar_admin)):
    """
    Essa rota retorna todos os Lugares da base para o administrador, mesmo estando desativado.
    """
    lugares = session.query(Lugar)\
        .options(joinedload(Lugar.evento))\
        .order_by(Lugar.id.desc())\
        .all()
        
    return lugares

@app.get("/places", response_model=list[LugarResponseSchema])
def get_places(
    name: str | None = None,
    category: str | None = None,
    occasion: str | None = None,
    price_level: int | None = None,
    min_rating: int | None = None,
    event_type: str | None = None,
    ids: list[int] | None = Query(None),
    session: Session = Depends(get_session)
):
    """
    Essa rota retorna todos os lugares filtrados pelos parametros passados: nome, categoria, ocasião, nível de preço, nota e se é fixo ou um evento. 

    Há a filtragem de locais desativados e eventos que já passaram.
    """
    if ids:
        return session.query(Lugar)\
            .options(joinedload(Lugar.evento))\
            .filter(Lugar.id.in_(ids), Lugar.ativo == True)\
            .all()
    
    lugar_query = session.query(Lugar).options(selectinload(Lugar.evento)).filter(Lugar.ativo == True)

    now = datetime.now()
    
    if event_type:
        lugar_query = lugar_query.filter(
            func.lower(Lugar.tipo) == event_type.lower(),
            Lugar.evento.has(Evento.data_fim >= now)
        )
    else:
        lugar_query = lugar_query.filter(
            or_(
                func.lower(Lugar.tipo) == 'fixo', 
                Lugar.evento.has(Evento.data_fim >= now)
            )
        )

    if name:
        lugar_query = lugar_query.filter(
            Lugar.nome.ilike(f"%{name}%")
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


@app.post("/places", response_model=LugarResponseSchema, status_code=status.HTTP_201_CREATED)
def create_place(lugar_schema: CriacaoLugarSchema, session: Session = Depends(get_session), 
                 usuario: dict = Depends(verificar_admin)):
    """
    Essa rota cria um local no banco de dados, mas apenas é permitida aos administradores. 

    Retorna 401 se não logado/token expirado e se não for admin.
    """
    if lugar_schema.type == "evento":
        db_place = Evento(nome=lugar_schema.name, rua=lugar_schema.street, numero_rua=lugar_schema.number,
                        bairro=lugar_schema.district, cep=lugar_schema.cep,categoria= lugar_schema.category.lower(),
                        tags= lugar_schema.occasion.lower(), preco=lugar_schema.priceLevel, nota=lugar_schema.rating,
                        descricao=lugar_schema.description,tipo= 'evento', image_url=lugar_schema.image,
                        data_inicio = lugar_schema.eventStartDate,
                        data_fim = lugar_schema.eventFinishDate,
                    )
        
    else:
        db_place = Lugar(nome=lugar_schema.name, rua=lugar_schema.street, numero_rua=lugar_schema.number,
                        bairro=lugar_schema.district, cep=lugar_schema.cep,categoria= lugar_schema.category.lower(),
                        tags= lugar_schema.occasion.lower(), preco=lugar_schema.priceLevel, nota=lugar_schema.rating,
                        descricao=lugar_schema.description,tipo= lugar_schema.type, image_url=lugar_schema.image)
    session.add(db_place)
    session.commit()
    session.refresh(db_place)

    return db_place


@app.post("/places/{id_place}/deactivate")
def deativate_place(id_place: int,  usuario: dict = Depends(verificar_admin), session: Session = Depends(get_session)):
    """
    Essa rota desativa o local referente ao id passado no banco de dados, mas apenas é permitida aos administradores. 

    Retorna 401 se não logado/token expirado e se não for admin.
    """
    lugar = session.query(Lugar).filter(Lugar.id == id_place).first()

    if not lugar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")

    lugar.ativo = False
    session.commit()
    return {"detail": "Lugar desativado com sucesso"}

@app.post("/places/{id_place}/activate")
def ativate_place(id_place: int,  usuario: dict = Depends(verificar_admin), session: Session = Depends(get_session)):
    """
    Essa rota ativa o local referente ao id passado no banco de dados, mas apenas é permitida aos administradores. 

    Retorna 401 se não logado/token expirado e se não for admin.
    """
    lugar = session.query(Lugar).filter(Lugar.id == id_place).first()

    if not lugar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")

    lugar.ativo = True
    session.commit()
    return {"detail": "Lugar ativado com sucesso"}

@app.delete("/places/{id_place}") 
def delete_favorite(id_place: int, request: Request, usuario: dict = Depends(verificar_admin), session: Session = Depends(get_session)):
    """
    Essa rota deleta o local referente ao id passado no banco de dados, mas apenas é permitida aos administradores. 

    Retorna 401 se não logado/token expirado e se não for admin.
    """
    lugar = session.query(Lugar).filter(Lugar.id == id_place).first()

    if not lugar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")
    
    #pegando o token na requisicao para mandar para a API admin
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de autorização ausente")

    headers_internos = {
        "Authorization": auth_header 
    }
    try:
        if lugar.tipo == "evento": #se eh um evento, exclui tbm na tabela referente
            evento = session.query(Evento).filter(Evento.id == id_place).first()
            if evento:
                session.delete(evento)

        session.delete(lugar) #deleta o lugar
        session.flush() 
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Erro interno ao tentar deletar no banco local: {str(e)}")

    try:
        url_limpa = f"{ADMIN_MODULE_URL}/favorites/clean-place/{id_place}"
        response = requests.delete(url_limpa, headers=headers_internos)
        
        if response.status_code == status.HTTP_200_OK:
            try:
                url_reviews = f"{REVIEW_SERVICE_URL}/internal/reviews/place/{id_place}"
                response_reviews = requests.delete(url_reviews)
                
                if not response_reviews.ok and response_reviews.status_code != status.HTTP_404_NOT_FOUND:
                    session.rollback()
                    raise HTTPException(status_code=response_reviews.status_code, 
                                        detail="Não foi possível sincronizar a exclusão com o módulo de avaliações")
            except requests.exceptions.RequestException:
                session.rollback()
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                                    detail="Módulo de avaliações indisponível. Operação cancelada por segurança.")
            
            session.commit()
            return {"detail": "Lugar, favoritos e avaliações removidos com sucesso"}
            
        else:
            session.rollback()
            raise HTTPException(status_code=response.status_code, 
                                detail="Não foi possível sincronizar a remoção de favoritos nos outros módulos")
            
    except requests.exceptions.RequestException:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                            detail="Módulo de administração indisponível. Operação cancelada por segurança.")

@app.put("/internal/places/{id_place}/rating")
def update_place_rating(id_place: int, rating_data: UpdateRatingSchema, session: Session = Depends(get_session)):
    """
    Rota interna para os outros microserviços atualizarem a nota e a quantidade de reviews de um lugar.
    """
    lugar = session.query(Lugar).filter(Lugar.id == id_place).first()
    if not lugar:
        raise HTTPException(status_code=404, detail="Lugar não encontrado")
    
    lugar.nota = rating_data.nota
    lugar.qntd_reviews = rating_data.qntd_reviews
    session.commit()
    return {"detail": "Nota e quantidade de reviews atualizadas com sucesso"}
    
    
