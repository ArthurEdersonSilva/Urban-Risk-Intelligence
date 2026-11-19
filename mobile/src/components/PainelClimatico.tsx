import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

// No navegador, a API está no próprio computador.
// No celular, usamos o endereço do computador na rede Wi-Fi.
const API_URL = Platform.OS === "web"
  ? "http://localhost:8080/api"
  : "http://192.168.0.30:8080/api";

type DadoClimatico = {
  id: number;
  origem: string;
  localizacao: string;
  temperatura: number;
  precipitacao: number;
  dataLeitura: string;
  registradoEm: string;
};

function formatarLeitura(data: string): string {
  return data ? data.replace("T", " ").slice(0, 16) : "Não informada";
}

export default function PainelClimatico() {
  const [clima, setClima] = useState<DadoClimatico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarClima() {
      try {
        const resposta = await fetch(
          `${API_URL}/dados-publicos/clima/historico`
        );
        if (!resposta.ok) {
          throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const dados: unknown = await resposta.json();
        if (!Array.isArray(dados)) {
          throw new Error("Resposta climática inválida");
        }

        const ultimo = dados[0] as DadoClimatico | undefined;
        if (ativo) {
          setClima(ultimo ?? null);
          setErro(false);
        }
      } catch (falha) {
        console.warn("Falha ao consultar histórico climático:", falha);
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarClima();
    const intervalo = setInterval(() => void carregarClima(), 60000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Monitoramento Climático</Text>

      {carregando && !clima ? (
        <ActivityIndicator color="#38BDF8" />
      ) : clima ? (
        <>
          <Text style={styles.localizacao}>{clima.localizacao}</Text>
          <Text style={styles.temperatura}>
            {Number(clima.temperatura).toFixed(1).replace(".", ",")} °C
          </Text>
          <Text style={styles.informacao}>
            Precipitação: {Number(clima.precipitacao).toFixed(1).replace(".", ",")} mm
          </Text>
          <Text style={styles.informacao}>Fonte: {clima.origem}</Text>
          <Text style={styles.atualizacao}>
            Leitura: {formatarLeitura(clima.dataLeitura)}
          </Text>
          {erro && (
            <Text style={styles.aviso}>
              Sem conexão. Exibindo a última leitura disponível.
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.informacao}>
          {erro
            ? "Não foi possível acessar o histórico climático."
            : "Nenhuma leitura climática disponível."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  localizacao: { color: "#CBD5E1", fontSize: 14 },
  temperatura: {
    color: "#38BDF8",
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 10,
  },
  informacao: { color: "#E2E8F0", fontSize: 14, marginTop: 6 },
  atualizacao: { color: "#94A3B8", fontSize: 12, marginTop: 12 },
  aviso: { color: "#FBBF24", fontSize: 12, marginTop: 10 },
});
