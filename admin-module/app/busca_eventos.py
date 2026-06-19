import requests
from bs4 import BeautifulSoup
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

class SearchEventSESC():
    def __init__(self):
        pass
    def search(self):
        url = "https://www.sescsp.org.br/programacao/?id=35&unidade=Ribeir%C3%A3o%20Preto"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        request = requests.get(url, headers=headers)
        soup = BeautifulSoup(request.text, "html.parser")

        


