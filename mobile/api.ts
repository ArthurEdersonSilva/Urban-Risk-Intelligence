
const API_URL = "http://localhost:8080/api";

export async function buscarSensores() {
  const resposta = await fetch(`${API_URL}/sensores`);

  if (!resposta.ok) {
    throw new Error("Erro ao buscar sensores");
  }

  return resposta.json();
}

export async function buscarEventos() {
  const resposta = await fetch(`${API_URL}/eventos`);

  if (!resposta.ok) {
    throw new Error("Erro ao buscar eventos");
  }

  return resposta.json();
}

export async function buscarAlertas() {
  const resposta = await fetch(`${API_URL}/alertas`);

  if (!resposta.ok) {
    throw new Error("Erro ao buscar alertas");
  }

  return resposta.json();
}
