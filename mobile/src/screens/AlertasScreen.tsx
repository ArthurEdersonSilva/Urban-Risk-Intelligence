
import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from "react-native";

import { buscarAlertas } from "../services/api";

interface Alerta {
  id: number;
  titulo: string;
  mensagem: string;
  pontuacaoRisco: number;
  prioridade: string;
  origem: string;
  confianca: number;
  status: string;
  visualizado: boolean;
  dataCriacao: string;
  evento: {
    id: number;
    tipo: string;
    localizacao: string | null;
  } | null;
}

type Filtro = "TODOS" | "ATIVO" | "RESOLVIDO";

export default function AlertasScreen() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [pesquisa, setPesquisa] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [conectado, setConectado] = useState(false);

  const [ultimaSincronizacao, setUltimaSincronizacao] =
    useState<Date | null>(null);

  const requisicaoEmAndamento = useRef(false);
  const telaAtiva = useRef(false);

  const carregarAlertas = useCallback(
    async (mostrarAtualizacao = false) => {
      if (requisicaoEmAndamento.current) {
        return;
      }

      requisicaoEmAndamento.current = true;

      if (mostrarAtualizacao && telaAtiva.current) {
        setAtualizando(true);
      }

      try {
        const dados = await buscarAlertas();

        if (!Array.isArray(dados)) {
          throw new Error("Resposta inválida da API");
        }

        if (telaAtiva.current) {
          setAlertas(dados);
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

    carregarAlertas();

    const intervalo = setInterval(() => {
      carregarAlertas();
    }, 10000);

    return () => {
      telaAtiva.current = false;
      clearInterval(intervalo);
    };
  }, [carregarAlertas]);

  function corPrioridade(prioridade: string) {
    switch (prioridade) {
      case "ALTA":
        return "#EF4444";

      case "MEDIA":
        return "#F59E0B";

      default:
        return "#22C55E";
    }
  }

  function formatarData(data: string) {
    const valor = new Date(data);

    if (isNaN(valor.getTime())) {
      return "Data inválida";
    }

    return valor.toLocaleString("pt-BR");
  }

  // Pesquisa sem diferenciar acentos e letras maiúsculas
  function normalizarTexto(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  // Pesquisa combinada com o filtro de status
  const termoPesquisa = normalizarTexto(pesquisa.trim());

  const alertasFiltrados = alertas.filter((alerta) => {
    const correspondeStatus =
      filtro === "TODOS" || alerta.status === filtro;

    const camposPesquisa = [
      alerta.titulo,
      alerta.mensagem,
      alerta.prioridade,
      alerta.origem,
      alerta.evento?.tipo,
      alerta.evento?.localizacao
    ];

    const correspondePesquisa = camposPesquisa.some(
      (campo) =>
        normalizarTexto(campo ?? "").includes(termoPesquisa)
    );

    return correspondeStatus && correspondePesquisa;
  });

  // Alertas ativos primeiro; depois por pontuação de risco
  const alertasOrdenados = [...alertasFiltrados].sort((a, b) => {
    if (a.status === "ATIVO" && b.status !== "ATIVO") {
      return -1;
    }

    if (a.status !== "ATIVO" && b.status === "ATIVO") {
      return 1;
    }

    return b.pontuacaoRisco - a.pontuacaoRisco;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => carregarAlertas(true)}
          tintColor="#38BDF8"
        />
      }
    >
      <Text style={styles.titulo}>
        Alertas Urbanos
      </Text>

      <Text style={styles.subtitulo}>
        Monitoramento e priorização de riscos
      </Text>

      {carregando ? (
        <ActivityIndicator
          size="large"
          color="#38BDF8"
        />
      ) : (
        <>
          {/* Status da conexão */}
          <View
            style={[
              styles.statusBox,
              conectado
                ? styles.statusConectado
                : styles.statusDesconectado
            ]}
          >
            <Text style={styles.statusBoxTitulo}>
              {conectado
                ? "● API Spring Boot conectada"
                : "● API desconectada"}
            </Text>

            <Text style={styles.sincronizacao}>
              Última sincronização:{" "}
              {ultimaSincronizacao
                ? ultimaSincronizacao.toLocaleString("pt-BR")
                : "Nenhuma sincronização realizada"}
            </Text>

            {!conectado && (
              <Text style={styles.aviso}>
                Exibindo últimos dados disponíveis.
                Nova tentativa automática a cada 10 segundos.
              </Text>
            )}
          </View>

          {/* Campo de pesquisa */}
          <TextInput
            style={styles.campoPesquisa}
            placeholder="Pesquisar alerta, tipo ou localização..."
            placeholderTextColor="#94A3B8"
            value={pesquisa}
            onChangeText={setPesquisa}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Pesquisar alertas"
          />

          {/* Filtros por status */}
          <View style={styles.filtros}>
            {(
              ["TODOS", "ATIVO", "RESOLVIDO"] as const
            ).map((opcao) => (
              <TouchableOpacity
                key={opcao}
                onPress={() => setFiltro(opcao)}
                accessibilityRole="button"
                accessibilityState={{
                  selected: filtro === opcao
                }}
                style={[
                  styles.filtroBotao,
                  filtro === opcao &&
                    styles.filtroSelecionado
                ]}
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    filtro === opcao &&
                      styles.filtroTextoSelecionado
                  ]}
                >
                  {opcao === "TODOS"
                    ? "Todos"
                    : opcao === "ATIVO"
                      ? "Ativos"
                      : "Resolvidos"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contador de resultados */}
          <Text style={styles.contador}>
            {alertasOrdenados.length} alerta(s) encontrado(s)
          </Text>

          {/* Lista de alertas */}
          {alertasOrdenados.length === 0 ? (
            <Text style={styles.vazio}>
              Nenhum alerta encontrado para esta pesquisa
              ou filtro.
            </Text>
          ) : (
            alertasOrdenados.map((alerta) => (
              <View
                key={alerta.id}
                style={styles.card}
              >
                <View style={styles.cabecalho}>
                  <Text style={styles.nome}>
                    {alerta.titulo}
                  </Text>

                  <View
                    style={[
                      styles.etiqueta,
                      {
                        backgroundColor: corPrioridade(
                          alerta.prioridade
                        )
                      }
                    ]}
                  >
                    <Text style={styles.etiquetaTexto}>
                      {alerta.prioridade}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detalhe}>
                  ID: {alerta.id}
                </Text>

                <Text style={styles.mensagem}>
                  {alerta.mensagem}
                </Text>

                <Text style={styles.detalhe}>
                  Pontuação de risco:{" "}
                  {alerta.pontuacaoRisco.toFixed(1)}
                </Text>

                <Text style={styles.detalhe}>
                  Confiança: {alerta.confianca}%
                </Text>

                <Text style={styles.detalhe}>
                  Origem: {alerta.origem}
                </Text>

                <Text style={styles.detalhe}>
                  Tipo: {alerta.evento?.tipo || "Não informado"}
                </Text>

                <Text style={styles.detalhe}>
                  Localização:{" "}
                  {alerta.evento?.localizacao ||
                    "Não informada"}
                </Text>

                <Text style={styles.detalhe}>
                  Registrado em:{" "}
                  {formatarData(alerta.dataCriacao)}
                </Text>

                <Text
                  style={[
                    styles.statusAlerta,
                    {
                      color:
                        alerta.status === "ATIVO"
                          ? "#F87171"
                          : "#4ADE80"
                    }
                  ]}
                >
                  Status: {alerta.status}
                </Text>
              </View>
            ))
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
    marginBottom: 24
  },

  statusBox: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 20
  },

  statusConectado: {
    backgroundColor: "#064E3B"
  },

  statusDesconectado: {
    backgroundColor: "#7F1D1D"
  },

  statusBoxTitulo: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center"
  },

  sincronizacao: {
    color: "#E2E8F0",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center"
  },

  aviso: {
    color: "#FECACA",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center"
  },

  campoPesquisa: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    marginBottom: 16
  },

  filtros: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14
  },

  filtroBotao: {
    backgroundColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8
  },

  filtroSelecionado: {
    backgroundColor: "#0369A1"
  },

  filtroTexto: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "bold"
  },

  filtroTextoSelecionado: {
    color: "#FFFFFF"
  },

  contador: {
    color: "#94A3B8",
    fontSize: 13,
    marginBottom: 16
  },

  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16
  },

  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12
  },

  nome: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1
  },

  etiqueta: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },

  etiquetaTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },

  mensagem: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14
  },

  detalhe: {
    color: "#CBD5E1",
    fontSize: 14,
    marginBottom: 8
  },

  statusAlerta: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10
  },

  vazio: {
    color: "#94A3B8",
    marginTop: 20
  }
});
