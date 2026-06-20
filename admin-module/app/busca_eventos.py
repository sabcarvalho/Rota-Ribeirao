import requests
from bs4 import BeautifulSoup
import os
from pathlib import Path
from dotenv import load_dotenv
import json
from datetime import datetime

#definicao do caminho das variaveis de ambiente quando se roda localmente
env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv() 


key_ticketmaster = os.getenv("KEY_TICKETMASTER") #url do supabase

class SearchEventIngresse():
    def __init__(self):
        pass
    def search(self):
        url = "https://api-site.ingresse.com/events/search?company_id=1&title=ribeir%C3%A3o%20preto&iso_code=BRA-SP&size=40&offset=0&order_by_date=true"
        req = requests.get(url)

        dados = req.json()
        for evento in dados.get("events"):
            if not "ribeir" in evento.get("place","").get("city","").lower():
                continue
            nome = evento.get("title")
            url_imagem = evento.get("poster", "").get("large","")
            data = evento.get("session", "").get("dateTime","")
            endereco = evento.get("place","").get("street")
            cep = evento.get("place","").get("zip")
            numero = ""
            rua = ""
            ocasiao = "amigos"
            if endereco:
                endereco_cortado = endereco.split(" ")
                numero = endereco_cortado[-1]
                rua = endereco.replace(numero, "")
            cep_formatado = cep.replace("-","")
            url_viacep = f"https://viacep.com.br/ws/{cep_formatado}/json/"

            r_viacep = requests.get(url_viacep)

            if r_viacep.status_code == 200:
                dados = r_viacep.json()
                bairro = dados.get("bairro","")


class SearchTicketmaster():
    def __init__(self):
        self.api_key = key_ticketmaster
        self.lat_rp = -21.1767
        self.lon_rp = -47.8208
        
        #raio de busca em quilometros
        self.radius = 25 
        self.base_url = "https://app.ticketmaster.com/discovery/v2/events.json"
    
    def search(self):
        now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

        params = {
            "apikey": self.api_key,
            "latlong": f"{self.lat_rp},{self.lon_rp}",
            "radius": self.radius,
            "unit": "km",
            "startDateTime": now,
            "sort": "date,asc",     #ordena do mais prox ao mais distante
            "size": 50              #limite de resultados
        }

        try:
            r = requests.get(self.base_url, params=params, timeout=10)
            
            if r.status_code == 200:
                dados = r.json()
                
                # A API retorna os eventos dentro do objeto '_embedded'
                # Se não houver eventos na região, o '_embedded' não existirá
                if '_embedded' in dados and 'events' in dados['_embedded']:
                    eventos_brutos = dados['_embedded']['events']
                    return self._processar_resultados(eventos_brutos)
                else:
                    print("A API respondeu, mas não encontrou grandes eventos na região.")
                    return []
                    
            elif r.status_code == 401:
                print("Erro 401: API Key inválida ou não autorizada.")
                return []
            elif r.status_code == 429:
                print("Erro 429: Limite de requisições diárias atingido (Rate Limit).")
                return []
            else:
                print(f"Erro na API. Status code: {r.status_code}")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"Erro de conexão: {e}")
            return []

    def _processar_resultados(self, eventos_brutos):
        eventos_limpos = []
        
        for evento in eventos_brutos:
            nome = evento.get('name', 'Nome Indisponível')
            url_compra = evento.get('url', '')
            
            data_str = "Data não definida"
            if 'dates' in evento and 'start' in evento['dates']:
                start_data = evento['dates']['start']
                local_date = start_data.get('localDate', '')
                local_time = start_data.get('localTime', '')
                # Junta a data com a hora se a hora estiver disponível
                if local_date and local_time:
                    data_str = f"{local_date} às {local_time}"
                elif local_date:
                    data_str = local_date

            imagem_url = ""
            imagens = evento.get('images', [])
            if imagens:
                # Procura a primeira imagem com ratio "16_9"
                for img in imagens:
                    if img.get('ratio') == "16_9":
                        imagem_url = img.get('url', '')
                        break
                # Se não encontrar 16:9, apanha a primeira disponível
                if not imagem_url and len(imagens) > 0:
                    imagem_url = imagens[0].get('url', '')

            # 4. Local (Venue)
            # Fica escondido num outro objeto '_embedded' interno
            nome_local = "Local Indisponível"
            if '_embedded' in evento and 'venues' in evento['_embedded']:
                venues = evento['_embedded']['venues']
                if len(venues) > 0:
                    nome_local = venues[0].get('name', 'Local Indisponível')

            # Adiciona à nossa lista limpa
            eventos_limpos.append({
                "nome": nome,
                "data": data_str,
                "local": nome_local,
                "imagem": imagem_url,
                "url": url_compra,
                "ocasiões": ["amigos", "comemoração"] # Eventos da TM costumam ser grandes shows
            })
            
        return eventos_limpos
