# Contrato de API — Rota Ribeirão

> Este documento descreve todos os endpoints que o frontend consome.
> O backend deve implementar exatamente estes formatos para que a integração funcione sem alterações no frontend.

---

## Configuração Base

| Item | Valor |
|---|---|
| URL base (dev) | `http://localhost:8000` |
| URL base (prod) | definir junto com o time |
| Formato | JSON (`Content-Type: application/json`) |
| Autenticação | Bearer Token (JWT) no header `Authorization` |
| CORS | liberar origin `http://localhost:5173` |

---

## Autenticação

### POST `/auth/login`
Login de usuário.

**Request body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "usuario@email.com",
    "isAdmin": false
  }
}
```

**Response 401 (credenciais inválidas):**
```json
{
  "detail": "Email ou senha inválidos"
}
```

---

### POST `/auth/register`
Cadastro de novo usuário.

**Request body:**
```json
{
  "name": "João Silva",
  "email": "usuario@email.com",
  "password": "senha123",
  "active": [opcional] true
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "João Silva",
    "email": "usuario@email.com",
    "isAdmin": false
  }
}
```

**Response 400 (email já cadastrado):**
```json
{
  "detail": "Email do usuario ja cadastrado"
}
```
---

## Favoritos

### GET `/places/favorites`
Retorna todos os lugares favoritados pelo usuário logado.

**Response 200:**
```json
[
  {
    "id": favorito.id,
    "place_id": lugar_id,
  }
]
```
---

### POST `/places/add_favorite/:id_lugar`
Adiciona um favorito na tabela Favorito de um dado usuário logado, recebendo o id do local sendo favoritado.

**Response 200:**
```json
[
  {
    "id": favorito.id,
    "detail": "Favorito adicionado com sucesso.",
  }
]
```

---

### DELETE `/places/delete_favorite/place/:id_lugar`
Deleta um Favorito de um dado usuário logado, referente ao id do local passado.

**Response 200:**
```json
[
  {
    "detail": "Favorito removido com sucesso.",
  }
]
```

---

### DELETE `/places/delete_favorite/place/all/:id_lugar`
Deleta todos os favoritos vinculados ao id do local passado. Apenas realizada por administradores.

**Response 200:**
```json
[
  {
    "detail": "Limpeza concluída. {linhas_deletadas} favoritos removidos.",
    "linhas_afetadas": list, 
    "linhas_afetadas": linhas_deletadas
  }
]
```


---

## Lugares

### GET `/search_place`
Lista todos os lugares com filtros opcionais via query params.

**Query params (todos opcionais):**
| Param | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `name` | string | `Nome do lugar` | Filtra por nome |
| `category` | string | `restaurante` | Filtra por categoria |
| `price_level` | number | `2` | Filtra por preço máximo (1–4) |
| `occasion` | string | `familia` | Filtra por ocasião |
| `min_rating` | number | `4.0` | Filtra por nota mínima |
| `event_type` | string | `fixo` | Filtra se é fixo ou evento |

**Categorias válidas:** `restaurante`, `bar`, `cafe`, `evento`, `mercado`

**Ocasiões válidas:** `familia`, `encontro`, `comemoracao`, `amigos`

**Tipos válidos:** `fixo`, `evento`

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Restaurante Sinhá Moça",
    "street": "Av. Costábile Romano",
    "number": "2201",
    "district": "Ribeirânia",
    "cep": "14025-020",
    "category": "restaurante",
    "occasion": "encontro,comemoracao,amigos",
    "priceLevel": 3,
    "rating": 4.7,
    "description": "Tradicional restaurante de culinária brasileira...",
    "type": "fixo",
    "image": "https://dlnews.com.br/imagens_noticias/img_1104072020173149.jpg",
    "event": null,
    "active": true
  }
]

> `event` é preenchido **apenas para eventos** (event_type = "evento"), no formato `YYYY-MM-DD`. Para outras categorias, enviar `null`.
```

> `image` pode ser null — o frontend usa uma imagem placeholder automática nesse caso.

---

### GET `/search_place/ids`
Retorna detalhes de todos os lugares passados na requisicao.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Restaurante Sinhá Moça",
    "street": "Av. Costábile Romano",
    "number": "2201",
    "district": "Ribeirânia",
    "cep": "14025-020",
    "category": "restaurante",
    "occasion": "encontro,comemoracao,amigos",
    "priceLevel": 3,
    "rating": 4.7,
    "description": "Tradicional restaurante de culinária brasileira...",
    "type": "fixo",
    "image": "https://dlnews.com.br/imagens_noticias/img_1104072020173149.jpg",
    "event": null,
    "active": true
  }
]
```

**Response 404:**
```json
{
  "detail": "Lugar não encontrado"
}
```

---

### GET `/admin/search_place/`
Retorna detalhes de todos os lugares, mesmos aqueles desativados. **Requer token de admin.**

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Restaurante Sinhá Moça",
    "street": "Av. Costábile Romano",
    "number": "2201",
    "district": "Ribeirânia",
    "cep": "14025-020",
    "category": "restaurante",
    "occasion": "encontro,comemoracao,amigos",
    "priceLevel": 3,
    "rating": 4.7,
    "description": "Tradicional restaurante de culinária brasileira...",
    "type": "fixo",
    "image": "https://dlnews.com.br/imagens_noticias/img_1104072020173149.jpg",
    "event": null,
    "active": true
  }
]
```

**Response 404:**
```json
{
  "detail": "Lugar não encontrado"
}
```

---

### POST `/add_place`
Cria um novo lugar. **Requer token de admin.**

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
  "name": "Novo Restaurante",
  "street": "Rua Exemplo",
  "number": "100",
  "district": "Bairro",
  "cep": "14000-00",
  "category": "restaurante",
  "occasion": "familia,amigos",
  "priceLevel": 2,
  "rating": 4.0,
  "description": "Descrição....",
  "type": "fixo",
  "image": "https://url-opcional.com/foto.jpg",
  "eventStartDate": "2026-06-08T01:04:10.110Z",
  "eventFinishDate": "2026-06-08T01:04:10.110Z",
}
```

**Response 201:**
```json
{
  "id": 9,
  "name": "Novo Restaurante",
  "street": "Rua Exemplo",
  "number": "100",
  "district": "Bairro",
  "cep": "14000-00",
  "category": "restaurante",
  ...
}
```

---

### POST `/deactivate_place/:id`
Desativa um lugar. **Requer token de admin.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "detail": "Lugar desativado com sucesso"
}
```

---

### POST `/ativate_place/:id`
Ativa um lugar. **Requer token de admin.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "detail": "Lugar ativado com sucesso"
}
```

---

### DELETE `/delete_place/:id`
Remove um lugar. **Requer token de admin.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "detail": "Lugar removido com sucesso"
}
```

---

## Avaliações

### POST `/places/:id/reviews`
Adiciona uma avaliação a um lugar. **Requer token de usuário logado.**

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
  "rating": 5,
  "comment": "Lugar incrível, recomendo muito!",
  "author": "João Silva"
}
```

**Response 201:**
```json
{
  "id": 10,
  "author": "João Silva",
  "rating": 5,
  "comment": "Lugar incrível, recomendo muito!",
  "date": "2025-05-27"
}
```

> Após criar uma review, o backend deve **recalcular e atualizar** o campo `rating` do lugar (média de todas as avaliações).

---

## Formato de Erro (padrão para todos os endpoints)

```json
{
  "detail": "Mensagem descrevendo o erro"
}
```

**Códigos HTTP utilizados pelo frontend:**
| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão (não é admin) |
| 404 | Não encontrado |
| 500 | Erro interno do servidor |

---

## WebSocket (fase futura)

Após a REST API estar funcionando, implementar WebSocket para:

| Evento (servidor → cliente) | Quando emitir | Payload |
|---|---|---|
| `rating_updated` | Nova review postada | `{ placeId, newAverage, totalReviews, newReview }` |
| `place_added` | Admin adiciona lugar | `{ place }` |
| `place_removed` | Admin remove lugar | `{ placeId }` |

**Canal/Room:** cada lugar terá um room `place_<id>`.
O frontend entra no room ao abrir a página de detalhe de um lugar.

---

## Resumo dos Endpoints

| Método | Endpoint | Auth? | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Não | Login |
| POST | `/auth/register` | Não | Cadastro |
| GET | `/places` | Não | Lista lugares (com filtros) |
| GET | `/places/:id` | Não | Detalhe de um lugar |
| POST | `/places` | Admin | Criar lugar |
| DELETE | `/places/:id` | Admin | Remover lugar |
| POST | `/places/:id/reviews` | Usuário logado | Adicionar avaliação |
