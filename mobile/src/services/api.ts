
const API_URL = "http://192.168.0.30:8080/api";

async function verificarResposta(resposta: Response) {
  if (!resposta.ok) {
    throw new Error(
      `Erro na API: ${resposta.status}`
    );
  }

  return resposta.json();
}

export async function buscarSensores() {
  const resposta = await fetch(`${API_URL}/sensores`);
  return verificarResposta(resposta);
}

export async function buscarEventos() {
  const resposta = await fetch(`${API_URL}/eventos`);
  return verificarResposta(resposta);
}

export async function buscarAlertas() {
  const resposta = await fetch(`${API_URL}/alertas`);
  return verificarResposta(resposta);
}

export interface NovaOcorrencia {
  titulo: string;
  tipo: string;
  descricao: string;
  latitude: number;
  longitude: number;
  localizacao: string;
  severidade: string;
  origem: string;
  confianca: number;
  populacaoAfetada: number;
}

export async function cadastrarOcorrencia(
  ocorrencia: NovaOcorrencia
) {
  const resposta = await fetch(`${API_URL}/eventos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(ocorrencia)
  });

  return verificarResposta(resposta);
}
