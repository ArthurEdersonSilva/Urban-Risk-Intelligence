
import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from "react-native";

import {
  buscarSensores,
  buscarEventos,
  buscarAlertas
} from "../services/api";

import NotificacaoAlerta from "../components/NotificacaoAlerta";
import PainelClimatico from "../components/PainelClimatico";

interface Sensor {
  id: number;
  nome: string;
  tipo: string;
  valor: number;
  unidade: string;
  origem: string;
  confianca: number;
  ativo: boolean;
  ultimaAtualizacao: string | null;
}

interface Evento {
  id: number;
  status: string;
}

interface Alerta {
  id: number;
  titulo: string;
  mensagem: string;
  prioridade: string;
  pontuacaoRisco: number;
  status: string;
  evento: {
    id: number;
    localizacao: string | null;
  } | null;
}

export default function DashboardScreen() {
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [conectado, setConectado] = useState(false);

  const [ultimaSincronizacao, setUltimaSincronizacao] =
    useState<Date | null>(null);

  const requisicaoEmAndamento = useRef(false);
  const telaAtiva = useRef(false);

  const carregarDados = useCallback(
    async (mostrarAtualizacao = false) => {
      if (requisicaoEmAndamento.current) {
        return;
      }

      requisicaoEmAndamento.current = true;

      if (mostrarAtualizacao && telaAtiva.current) {
        setAtualizando(true);
      }

      try {
        const [
          dadosSensores,
          dadosEventos,
          dadosAlertas
        ] = await Promise.all([
          buscarSensores(),
          buscarEventos(),
          buscarAlertas()
        ]);

        if (
          !Array.isArray(dadosSensores) ||
          !Array.isArray(dadosEventos) ||
          !Array.isArray(dadosAlertas)
        ) {
          throw new Error("Resposta inválida da API");
        }

        if (telaAtiva.current) {
          setSensores(dadosSensores);
          setEventos(dadosEventos);
          setAlertas(dadosAlertas);

          setConectado(true);
          setUltimaSincronizacao(new Date());
        }
      } catch {
        if (telaAtiva.current) {
          setConectado(false);
        }
      } finally {
        requisicaoEmAndamento.current = false;

        if (telaAtiva.current) {
          setCarregando(false);
          setAtualizando(false);
        }
      }
    },
    []
  );

  // Atualização automática a cada 10 segundos
  useEffect(() => {
    telaAtiva.current = true;

    carregarDados();

    const intervalo = setInterval(() => {
      carregarDados();
    }, 10000);

    return () => {
      telaAtiva.current = false;
      clearInterval(intervalo);
    };
  }, [carregarDados]);

  const sensoresAtivos = sensores.filter(
    (sensor) => sensor.ativo === true
  ).length;

  const eventosAtivos = eventos.filter(
    (evento) => evento.status === "ATIVO"
  ).length;

  const alertasAtivos = alertas.filter(
    (alerta) => alerta.status === "ATIVO"
  ).length;

  // Selecionar alertas de risco alto ainda ativos
  const alertasCriticos = alertas
    .filter(
      (alerta) =>
        alerta.status === "ATIVO" &&
        alerta.prioridade === "ALTA"
    )
    .sort(
      (a, b) =>
        b.pontuacaoRisco - a.pontuacaoRisco
    );

  function identificarRisco(sensor: Sensor) {
    if (!sensor.ativo) {
      return {
        texto: "DESATIVADO",
        cor: "#94A3B8"
      };
    }

    if (sensor.tipo === "TEMPERATURA") {
      if (sensor.valor >= 40) {
        return {
          texto: "RISCO ALTO",
          cor: "#EF4444"
        };
      }

      if (sensor.valor >= 35) {
        return {
          texto: "ATENÇÃO",
          cor: "#F59E0B"
        };
      }
    }

    if (sensor.tipo === "NIVEL_AGUA") {
      if (sensor.valor >= 80) {
        return {
          texto: "RISCO ALTO",
          cor: "#EF4444"
        };
      }

      if (sensor.valor >= 50) {
        return {
          texto: "ATENÇÃO",
          cor: "#F59E0B"
        };
      }
    }

    return {
      texto: "NORMAL",
      cor: "#22C55E"
    };
  }

  function formatarData(data: string | null) {
    if (!data) {
      return "Não disponível";
    }

    const valor = new Date(data);

    if (isNaN(valor.getTime())) {
      return "Data inválida";
    }

    return valor.toLocaleString("pt-BR");
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => carregarDados(true)}
          tintColor="#38BDF8"
        />
      }
    >
      <Text style={styles.titulo}>
        Painel de Monitoramento
      </Text>

      <Text style={styles.subtitulo}>
        Urban Risk Intelligence Platform
      </Text>

      {carregando ? (
        <ActivityIndicator
          size="large"
          color="#38BDF8"
        />
      ) : (
        <>
          {/* Notificações de alta prioridade */}
          {alertasCriticos.length > 0 && (
            <View style={styles.areaAlertas}>
              <Text style={styles.secaoAlertasTitulo}>
                Alertas de Alta Prioridade
              </Text>

              {alertasCriticos.map((alerta) => (
                <NotificacaoAlerta
                  key={alerta.id}
                  titulo={alerta.titulo}
                  mensagem={alerta.mensagem}
                  prioridade={alerta.prioridade}
                  localizacao={
                    alerta.evento?.localizacao
                  }
                />
              ))}
            </View>
          )}

          {/* Indicadores principais */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>
              Sensores Ativos
            </Text>

            <Text style={styles.numero}>
              {sensoresAtivos}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>
              Eventos Ativos
            </Text>

            <Text style={styles.numero}>
              {eventosAtivos}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>
              Alertas Ativos
            </Text>

            <Text style={styles.numero}>
              {alertasAtivos}
            </Text>
          </View>

          {/* Status da conexão */}
          <View
            style={[
              styles.status,
              conectado
                ? styles.statusConectado
                : styles.statusDesconectado
            ]}
          >
            <Text style={styles.statusTexto}>
              {conectado
                ? "● API Spring Boot conectada"
                : "● API desconectada"}
            </Text>

            <Text style={styles.sincronizacao}>
              Última sincronização:{" "}
              {ultimaSincronizacao
                ? ultimaSincronizacao.toLocaleString(
                    "pt-BR"
                  )
                : "Nenhuma sincronização realizada"}
            </Text>

            {!conectado && (
              <Text style={styles.aviso}>
                Exibindo últimos dados disponíveis.
                Nova tentativa automática a cada 10 segundos.
              </Text>
            )}
          </View>

          {/* Dados meteorológicos públicos */}
          <PainelClimatico />

          {/* Monitoramento dos sensores */}
          <Text style={styles.secaoTitulo}>
            Monitoramento de Sensores
          </Text>

          {sensores.length === 0 ? (
            <Text style={styles.vazio}>
              Nenhum sensor disponível.
            </Text>
          ) : (
            sensores.map((sensor) => {
              const risco = identificarRisco(sensor);

              return (
                <View
                  key={sensor.id}
                  style={styles.sensorCard}
                >
                  <View style={styles.sensorCabecalho}>
                    <Text style={styles.sensorNome}>
                      {sensor.nome}
                    </Text>

                    <View
                      style={[
                        styles.etiqueta,
                        {
                          backgroundColor: risco.cor
                        }
                      ]}
                    >
                      <Text style={styles.etiquetaTexto}>
                        {risco.texto}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sensorTipo}>
                    {sensor.tipo.replace(/_/g, " ")}
                  </Text>

                  <Text style={styles.sensorValor}>
                    {sensor.valor} {sensor.unidade}
                  </Text>

                  <Text style={styles.sensorDetalhe}>
                    Origem: {sensor.origem}
                  </Text>

                  <Text style={styles.sensorDetalhe}>
                    Confiança: {sensor.confianca}%
                  </Text>

                  <Text style={styles.sensorDetalhe}>
                    Última leitura:{" "}
                    {formatarData(
                      sensor.ultimaAtualizacao
                    )}
                  </Text>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A"
  },

  conteudo: {
    padding: 20,
    paddingBottom: 40
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8
  },

  subtitulo: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 30
  },

  areaAlertas: {
    marginBottom: 14
  },

  secaoAlertasTitulo: {
    color: "#FCA5A5",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14
  },

  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16
  },

  cardTitulo: {
    color: "#CBD5E1",
    fontSize: 16
  },

  numero: {
    color: "#38BDF8",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 10
  },

  status: {
    padding: 16,
    borderRadius: 10,
    marginTop: 10
  },

  statusConectado: {
    backgroundColor: "#064E3B"
  },

  statusDesconectado: {
    backgroundColor: "#7F1D1D"
  },

  statusTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center"
  },

  sincronizacao: {
    color: "#E2E8F0",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8
  },

  aviso: {
    color: "#FECACA",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10
  },

  secaoTitulo: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 16
  },

  sensorCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16
  },

  sensorCabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10
  },

  sensorNome: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    flexShrink: 1
  },

  sensorTipo: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 10
  },

  sensorValor: {
    color: "#38BDF8",
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 12
  },

  sensorDetalhe: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 6
  },

  etiqueta: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },

  etiquetaTexto: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold"
  },

  vazio: {
    color: "#94A3B8",
    marginTop: 10
  }
});
