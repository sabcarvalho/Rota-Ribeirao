from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import Review
from app.schemas import ReviewCreateSchema, ReviewResponseSchema
from app.dependencies import get_session, verificar_token
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONT_END_URL", "http://localhost:3000").rstrip('/') # Garante que não haja barra no final
PLACES_SERVICE_URL = os.getenv("PLACES_SERVICE_URL", "http://places-api:8000").rstrip('/') # Garante que não haja barra no final

app = FastAPI(title="Rota Ribeirão - Reviews Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/places/{id_place}/reviews", response_model=ReviewResponseSchema, status_code=201)
def create_review(
    id_place: int,
    review_data: ReviewCreateSchema,
    session: Session = Depends(get_session),
    usuario_payload: dict = Depends(verificar_token)
):
    id_usuario = int(usuario_payload.get("sub"))
    nome_usuario = usuario_payload.get("name", "Usuário Anônimo")

    # 1. Validar se o local existe usando o microservico places-service
    try:
        place_resp = requests.get(f"{PLACES_SERVICE_URL}/places/?ids={id_place}")
        if place_resp.status_code != 200 or not place_resp.json():
            raise HTTPException(status_code=404, detail="Lugar não encontrado no sistema.")
        
        place_info = place_resp.json()[0]
        media_antiga = float(place_info.get("rating", 0.0))
        qntd_antiga = int(place_info.get("qntd_reviews", 0))
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Serviço de lugares indisponível no momento.")

    # 2. Salvar a avaliação localmente
    nova_review = Review(
        id_lugar=id_place,
        id_usuario=id_usuario,
        nome_autor=nome_usuario,
        nota=review_data.rating,
        comentario=review_data.comment,
        is_anonymous=review_data.is_anonymous
    )
    
    try:
        session.add(nova_review)
        session.commit()
        session.refresh(nova_review)
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Você já avaliou este lugar.")
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao salvar a avaliação.")

    # 3. Calcular a nova média aritmética
    qntd_nova = qntd_antiga + 1
    if qntd_antiga == 0:
        media_nova = float(review_data.rating)
    else:
        media_nova = ((media_antiga * qntd_antiga) + review_data.rating) / qntd_nova

    # 4. Atualizar a nota e contagem via integração (rollback de segurança se falhar)
    try:
        update_payload = {
            "nota": round(media_nova, 1),
            "qntd_reviews": qntd_nova
        }
        update_resp = requests.put(
            f"{PLACES_SERVICE_URL}/internal/places/{id_place}/rating",
            json=update_payload
        )
        if not update_resp.ok:
            session.delete(nova_review)
            session.commit()
            raise HTTPException(status_code=500, detail="Não foi possível sincronizar a nova nota do local.")
    except requests.exceptions.RequestException:
        session.delete(nova_review)
        session.commit()
        raise HTTPException(status_code=503, detail="Falha de comunicação ao recalcular pontuação.")

    return nova_review

def _serialize_review(review: Review) -> ReviewResponseSchema:
    return ReviewResponseSchema(
        id=review.id,
        id_lugar=review.id_lugar,
        id_usuario=review.id_usuario,
        nome_autor="Usuário Anônimo" if review.is_anonymous else review.nome_autor,
        nota=review.nota,
        comentario=review.comentario,
        data_criacao=review.data_criacao,
        is_anonymous=review.is_anonymous,
    )

@app.get("/places/{id_place}/reviews", response_model=list[ReviewResponseSchema])
def get_place_reviews(id_place: int, session: Session = Depends(get_session)):
    reviews = session.query(Review)\
        .filter(Review.id_lugar == id_place)\
        .order_by(Review.data_criacao.desc())\
        .all()
    return [_serialize_review(review) for review in reviews]

@app.get("/reviews/count")
def count_reviews(session: Session = Depends(get_session)):
    """Retorna o total de avaliações existentes no sistema."""
    total = session.query(Review).count()
    return {"total": total}

@app.get("/reviews/user/{id_usuario}", response_model=list[ReviewResponseSchema])
def get_user_reviews(id_usuario: int, session: Session = Depends(get_session)):
    reviews = session.query(Review)\
        .filter(Review.id_usuario == id_usuario)\
        .order_by(Review.data_criacao.desc())\
        .all()
    return [_serialize_review(review) for review in reviews]

@app.delete("/reviews/{id_review}")
def delete_review(
    id_review: int,
    session: Session = Depends(get_session),
    usuario_payload: dict = Depends(verificar_token)
):
    """
    Exclui uma avaliação. Permitido apenas para o ADMINISTRADOR (qualquer avaliação)
    ou para o AUTOR da própria avaliação. Recalcula a nota média do lugar.
    """
    id_usuario = int(usuario_payload.get("sub"))
    is_admin = str(usuario_payload.get("isAdmin")) == "True"

    review = session.query(Review).filter(Review.id == id_review).first()
    if not review:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")

    # Autorização: admin OU dono da avaliação
    if not is_admin and review.id_usuario != id_usuario:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta avaliação.")

    id_lugar = review.id_lugar
    session.delete(review)
    session.commit()

    # Recalcula nota média e contagem do lugar com base nas avaliações restantes
    restantes = session.query(Review).filter(Review.id_lugar == id_lugar).all()
    qntd = len(restantes)
    media = round(sum(r.nota for r in restantes) / qntd, 1) if qntd > 0 else 0.0

    try:
        requests.put(
            f"{PLACES_SERVICE_URL}/internal/places/{id_lugar}/rating",
            json={"nota": media, "qntd_reviews": qntd}
        )
    except requests.exceptions.RequestException:
        # A avaliação já foi removida; a nota será reconciliada em uma próxima operação.
        pass

    return {"detail": "Avaliação removida com sucesso."}

@app.delete("/internal/reviews/place/{id_place}")
def delete_place_reviews_internal(id_place: int, session: Session = Depends(get_session)):
    linhas_removidas = session.query(Review).filter(Review.id_lugar == id_place).delete()
    session.commit()
    return {"detail": f"Avaliações do local limpas. {linhas_removidas} registros removidos."}