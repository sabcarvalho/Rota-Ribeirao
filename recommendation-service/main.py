from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from collections import Counter
import httpx
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONT_END_URL", "http://localhost:5173")
PLACES_SERVICE_URL = os.getenv("PLACES_SERVICE_URL", "http://places-api:8000").rstrip('/')
REVIEWS_SERVICE_URL = os.getenv("REVIEWS_SERVICE_URL", "http://reviews-api:8000").rstrip('/')
ADMIN_SERVICE_URL = os.getenv("ADMIN_SERVICE_URL", "http://admin-api:8000").rstrip('/')

app = FastAPI(title="Serviço de Recomendações - Rota Ribeirão")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calcular_recomendacoes_finais(candidatos: list, globais: list, ids_conhecidos: set, limit: int) -> list:
    """
    Remove os lugares já conhecidos pelo usuário e completa a lista com o top global 
    caso a categoria preferida não retorne resultados suficientes.
    """
    recomendacoes = [c for c in candidatos if c.get("id") not in ids_conhecidos]
    
    if len(recomendacoes) < limit:
        ids_ja_recomendados = {c.get("id") for c in recomendacoes}
        for g in globais:
            if len(recomendacoes) >= limit:
                break
            if g.get("id") not in ids_conhecidos and g.get("id") not in ids_ja_recomendados:
                recomendacoes.append(g)

    return recomendacoes[:limit]


@app.get("/recommendations/user/{id_usuario}")
async def get_recommendations(id_usuario: int, request: Request, limit: int = 10):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Token de autorização ausente")
    
    headers_internos = {"Authorization": auth_header}

    # Levantar o histórico do usuário (Favoritos e Avaliações)
    async with httpx.AsyncClient() as client:
        res_favs, res_reviews = await asyncio.gather(
            client.get(f"{ADMIN_SERVICE_URL}/places/favorites", headers=headers_internos),
            client.get(f"{REVIEWS_SERVICE_URL}/reviews/user/{id_usuario}", headers=headers_internos),
            return_exceptions=True
        )

    favoritos = res_favs.json() if not isinstance(res_favs, Exception) and res_favs.status_code == 200 else []
    avaliacoes = res_reviews.json() if not isinstance(res_reviews, Exception) and res_reviews.status_code == 200 else []

    ids_favoritos = {f.get("place_id") for f in favoritos if isinstance(f, dict)}
    ids_avaliados = {r.get("id_lugar") for r in avaliacoes if isinstance(r, dict)}
    ids_conhecidos = ids_favoritos.union(ids_avaliados)

    # Considera como referencia: Favoritos + Avaliações nota 5.0
    ids_gostou = set(ids_favoritos)
    for r in avaliacoes:
        if isinstance(r, dict) and r.get("rating", 0) == 5.0:
            ids_gostou.add(r.get("id_lugar"))

    # Processar categorias e buscar candidatos
    async with httpx.AsyncClient() as client:
        # Se usuário não possui histórico de gostos, retorna o Top 10 geral
        if not ids_gostou:
            res_global = await client.get(f"{PLACES_SERVICE_URL}/places/top_rated?limit={limit}")
            return res_global.json() if res_global.status_code == 200 else []

        # Extrai as categorias dos locais favoritos/avaliados
        payload_ids = {"ids": list(ids_gostou)}
        res_categorias = await client.post(f"{PLACES_SERVICE_URL}/places/extract_categories", json=payload_ids)
        
        candidatos = []
        globais = []

        if res_categorias.status_code == 200:
            dados_categorias = res_categorias.json()
            lista_categorias = [item.get("category") for item in dados_categorias if item.get("category")]
            
            if lista_categorias:
                top_categoria = Counter(lista_categorias).most_common(1)[0][0]
                
                # Busca simultaneamente o Top Categoria e o Top Global
                res_cat, res_global = await asyncio.gather(
                    client.get(f"{PLACES_SERVICE_URL}/places/top_rated?category={top_categoria}&limit={limit * 2}"),
                    client.get(f"{PLACES_SERVICE_URL}/places/top_rated?limit={limit}"),
                )
                
                candidatos = res_cat.json() if res_cat.status_code == 200 else []
                globais = res_global.json() if res_global.status_code == 200 else []
            else:
                res_global = await client.get(f"{PLACES_SERVICE_URL}/places/top_rated?limit={limit}")
                globais = res_global.json() if res_global.status_code == 200 else []
        else:
            res_global = await client.get(f"{PLACES_SERVICE_URL}/places/top_rated?limit={limit}")
            globais = res_global.json() if res_global.status_code == 200 else []

    # ETAPA 3: Montagem Final
    return calcular_recomendacoes_finais(candidatos, globais, ids_conhecidos, limit)