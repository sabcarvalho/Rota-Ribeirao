import requests
import time
import logging
from datetime import datetime
from app.main import PLACES_SERVICE_URL, KEY_TICKETMASTER

# Configuração de Logs
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')



class BaseEventCrawler:
    """Classe base contendo a lógica de envio para a API FastAPI."""
    def __init__(self, admin_token):
        self.api_url = PLACES_SERVICE_URL
        self.admin_token = admin_token

    def enviar_para_api(self, evento_data: dict):
        headers = {
            "Authorization": f"{self.admin_token}",
            "Content-Type": "application/json"
        }
        try:
            resposta = requests.post(f"{self.api_url}/places", json=evento_data, headers=headers)
            if resposta.status_code == 201:
                logging.info(f"Evento '{evento_data['name']}' salvo no banco (Status: Pendente)!")
            else:
                logging.error(f"Erro ao salvar '{evento_data['name']}': {resposta.status_code} - {resposta.text}")
        except Exception as e:
            logging.error(f"Erro de conexão com a API FastAPI: {e}")

class SearchEventIngresse(BaseEventCrawler):
    def __init__(self, admin_token):
        super().__init__(admin_token)

    def search(self):
        url = "https://api-site.ingresse.com/events/search?company_id=1&title=ribeir%C3%A3o%20preto&iso_code=BRA-SP&size=40&offset=0&order_by_date=true"
        logging.info("Iniciando busca de eventos na Ingresse...")
        
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                dados = r.json()
                self._processar_e_enviar(dados)
            else:
                logging.error(f"Erro na API Ingresse. Status code: {r.status_code}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Erro de conexão com Ingresse: {e}")

    def _processar_e_enviar(self, dados_brutos):
        eventos = dados_brutos.get("events", [])
        logging.info(f"Encontrados {len(eventos)} possíveis eventos na Ingresse.")

        for evento in eventos:
            try:
                place = evento.get("place", {})
                if not place or "ribeir" not in place.get("city", "").lower():
                    continue
                
                nome = evento.get("title", "Evento sem nome")
                slug = evento.get("slug", "")
                url_compra = f"https://ingresse.com/{slug}"
                imagem_url = evento.get("poster", {}).get("large", "")
                
                # Tratamento de Data
                data_crua = evento.get("session", {}).get("dateTime", "")
                data_formatada = f"{data_crua[:10]}T00:00:00" if data_crua else None
                
                # Tratamento de Endereço
                endereco_completo = place.get("street", "")
                cep = place.get("zip", "")
                rua = ""
                numero = ""
                
                if endereco_completo:
                    endereco_cortado = endereco_completo.split(" ")
                    numero = endereco_cortado[-1]
                    rua = endereco_completo.replace(numero, "").strip()
                
                # Busca de Bairro pelo ViaCEP
                bairro = ""
                if cep:
                    cep_formatado = cep.replace("-", "")
                    url_viacep = f"https://viacep.com.br/ws/{cep_formatado}/json/"
                    r_viacep = requests.get(url_viacep)
                    if r_viacep.status_code == 200:
                        bairro = r_viacep.json().get("bairro", "")

                nome_local = place.get('name', 'Local indisponível')
                descricao = f"Evento acontecerá no {nome_local}. Compre seu ingresso pela Ingresse: {url_compra}."

                payload = {
                    "name": nome,
                    "eventStartDate": data_formatada,
                    "eventFinishDate": data_formatada,
                    "cep": cep,
                    "street": rua,
                    "number": numero,
                    "district": bairro,
                    "image": imagem_url,
                    "description": descricao,
                    "occasion": "amigos,comemoração",
                    "priceLevel": 4,
                    "category": "evento",
                    "rating": 0.0,
                    "type": "evento",
                    "status": "pendente"
                }
                self.enviar_para_api(payload)
                
            except Exception as e:
                logging.error(f"Erro ao processar um evento da Ingresse: {e}")


class SearchTicketmaster(BaseEventCrawler):
    def __init__(self, admin_token):
        super().__init__(admin_token)
        self.api_key = KEY_TICKETMASTER
        self.lat_rp = -21.1767
        self.lon_rp = -47.8208
        self.radius = 25 
        self.base_url = "https://app.ticketmaster.com/discovery/v2/events.json"
        self.headers = {
            "User-Agent": "RotaRibeiraoBot/1.0 (sabrinascarvalho@usp.br)"
        }
    
    def search(self):
        now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        params = {
            "apikey": self.api_key,
            "latlong": f"{self.lat_rp},{self.lon_rp}",
            "radius": self.radius,
            "unit": "km",
            "startDateTime": now,
            "sort": "date,asc",
            "size": 50 
        }

        logging.info("Iniciando busca de eventos na Ticketmaster...")
        try:
            r = requests.get(self.base_url, params=params, timeout=10)
            
            if r.status_code == 200:
                dados = r.json()
                if '_embedded' in dados and 'events' in dados['_embedded']:
                    eventos_brutos = dados['_embedded']['events']
                    self._processar_e_enviar(eventos_brutos)
                else:
                    logging.info("A API respondeu, mas não encontrou grandes eventos na região.")
            else:
                logging.error(f"Erro Ticketmaster: {r.status_code} - {r.text}")
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Erro de conexão Ticketmaster: {e}")

    def _processar_e_enviar(self, eventos_brutos):
        logging.info(f"Processando {len(eventos_brutos)} eventos da Ticketmaster...")
        
        for evento in eventos_brutos:
            try:
                nome = evento.get('name', 'Nome Indisponível')
                url_compra = evento.get('url', '')
                
                #tratando a data
                data_str = None
                if 'dates' in evento and 'start' in evento['dates']:
                    start_data = evento['dates']['start']
                    local_date = start_data.get('localDate', '')
                    local_time = start_data.get('localTime', '00:00:00')
                    if local_date:
                        #formatando para a api
                        data_str = f"{local_date}T{local_time}"

                #pegando uma imagem
                imagem_url = ""
                imagens = evento.get('images', [])
                for img in imagens:
                    if img.get('ratio') == "16_9":
                        imagem_url = img.get('url', '')
                        break
                if not imagem_url and imagens:
                    imagem_url = imagens[0].get('url', '')

                #tratando endereco
                nome_local = "Local Indisponível"
                rua = num_rua = bairro = cep = ""
                
                if '_embedded' in evento and 'venues' in evento['_embedded']:
                    venues = evento['_embedded']['venues']
                    if venues:
                        venue = venues[0]
                        nome_local = venue.get('name', 'Local Indisponível')
                        cep = venue.get('postalCode', '')
                        
                        location = venue.get('location', {})
                        if location:
                            lon = location.get('longitude')
                            lat = location.get('latitude')
                            
                            #Nominatim exige delay entre requisições
                            time.sleep(2)
                            url_nominatim = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
                            r_geo = requests.get(url_nominatim, headers=self.headers)

                            if r_geo.status_code == 200:
                                endereco_completo = r_geo.json().get('address', {})
                                rua = endereco_completo.get('road', '')
                                num_rua = endereco_completo.get('house_number', 'S/N')
                                bairro = endereco_completo.get('suburb', '')

                descricao = f"Evento acontecerá no {nome_local}. Compre seu ingresso pela Ticketmaster: {url_compra}"
                
                payload = {
                    "name": nome,
                    "eventStartDate": data_str,
                    "eventFinishDate": data_str,
                    "cep": cep,
                    "street": rua,
                    "number": num_rua,
                    "district": bairro,
                    "image": imagem_url,
                    "description": descricao,
                    "occasion": "amigos,comemoração",
                    "priceLevel": 4,
                    "category": "evento",
                    "rating": 0.0,
                    "type": "evento",
                    "status": "pendente"
                }
                self.enviar_para_api(payload)
                
            except Exception as e:
                logging.error(f"Erro ao processar um evento da Ticketmaster: {e}")

if __name__ == "__main__":
    TOKEN_ADMIN = ""
    
    robo_ingresse = SearchEventIngresse(TOKEN_ADMIN)
    robo_ingresse.search()
    
    robo_ticketmaster = SearchTicketmaster(TOKEN_ADMIN)
    robo_ticketmaster.search()