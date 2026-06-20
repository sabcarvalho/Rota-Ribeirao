from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from app.dependencies import get_session, verificar_token
from app.search_places import SearchPlacesOverpass
from app.search_events import SearchEventIngresse, SearchTicketmaster

crawler_router = APIRouter(
    prefix="/crawlers", 
    tags=["Admin Crawlers"]
)

# Função que vai rodar escondida
def executar_robo_lugares(tipo: str, token: str):
    robo = SearchPlacesOverpass(categoria_schema=tipo, admin_token=token)
    robo.search()

@crawler_router.post("/places/{type_place}")
def disparar_busca_lugares(
    type_place: str, # "bar", "restaurante", "cafe", "mercado"
    background_tasks: BackgroundTasks, 
    request: Request,
    usuario: dict = Depends(verificar_token) # Garante que só admin chama
):
    if usuario.admin:
        tipos_permitidos = ["bar", "restaurante", "cafe", "mercado"]
        if type_place not in tipos_permitidos:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de lugar inválido.")

        token_admin = request.headers.get("Authorization")
        if not token_admin:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de autorização ausente")

        background_tasks.add_task(executar_robo_lugares, type_place, token_admin)
        
        return {"message": f"O robô foi enviado para buscar {type_place}s. Os resultados aparecerão no painel em breve!"}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas administradores podem realizar esta operação"
        )

def executar_robos_eventos(token: str):
    SearchEventIngresse(admin_token=token).search()
    SearchTicketmaster(admin_token=token).search()

@crawler_router.post("/events")
def disparar_busca_eventos(background_tasks: BackgroundTasks,request: Request, usuario: dict = Depends(verificar_token)):
    if usuario.admin:
        token_admin = request.headers.get("Authorization")
        if not token_admin:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de autorização ausente")
        background_tasks.add_task(executar_robos_eventos, token_admin)
        return {"message": "Busca por eventos iniciada na Ingresse e Ticketmaster!"}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas administradores podem realizar esta operação"
        )