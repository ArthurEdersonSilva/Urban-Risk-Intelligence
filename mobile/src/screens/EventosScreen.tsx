
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

import { buscarEventos } from "../services/api";

interface Evento {
  id: number;
  titulo: string;
  tipo: string;
  descricao: string | null;
  localizacao: string | null;
  severidade: string;
  status: string;
  origem: string;
  confianca: number;
  dataRegistro: string;
}

type Filtro = "TODOS" | "ATIVO" | "RESOLVIDO";

export default function EventosScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [pesquisa, setPesquisa] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [conectado, setConectado] = useState(false);

  const [ultimaSincronizacao, setUltimaSincronizacao] =
    useState<Date | null>(null);

  const requisicaoEmAndamento = useRef(false);
  const telaAtiva = useRef(false);

  const carregarEventos = useCallback(
    async (mostrarAtualizacao = false) => {
      if (requisicaoEmAndamento.current) {
        return;
      }

      requisicaoEmAndamento.current = true;

      if (mostrarAtualizacao && telaAtiva.current) {
        setAtualizando(true);
      }

      try {
        const dados = await buscarEventos();

        if (!Array.isArray(dados)) {
          throw new Error("Resposta inválida da API");
        }

        if (telaAtiva.current) {
          setEventos(dados);
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

    carregarEventos();

    const intervalo = setInterval(() => {
      carregarEventos();
    }, 10000);

    return () => {
      telaAtiva.current = false;
      clearInterval(intervalo);
    };
  }, [carregarEventos]);

  function formatarData(data: string) {
    const valor = new Date(data);

    if (isNaN(valor.getTime())) {
      return "Data inválida";
    }

    return valor.toLocaleString("pt-BR");
  }

  function corSeveridade(severidade: string) {
    switch (severidade) {
      case "ALTA":
        return "#EF4444";

      case "MEDIA":
        return "#F59E0B";

      default:
        return "#22C55E";
    }
  }

  // Normaliza o texto para pesquisar sem diferenciar
  // letras maiúsculas, minúsculas ou acentos
  function normalizarTexto(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  // Pesquisa e filtro por status
  const termoPesquisa = normalizarTexto(pesquisa.trim());

  const eventosFiltrados = eventos.filter((evento) => {
    const correspondeStatus =
      filtro === "TODOS" || evento.status === filtro;

    const camposPesquisa = [
      evento.titulo,
      evento.tipo,
      evento.localizacao,
      evento.descricao
    ];

    const correspondePesquisa = camposPesquisa.some(
      (campo) =>
        normalizarTexto(campo ?? "").includes(termoPesquisa)
    );

    return correspondeStatus && correspondePesquisa;
  });

  // Eventos ativos primeiro; depois, os mais recentes
  const eventosOrdenados = [...eventosFiltrados].sort((a, b) => {
    if (a.status === "ATIVO" && b.status !== "ATIVO") {
      return -1;
    }

    if (a.status !== "ATIVO" && b.status === "ATIVO") {
      return 1;
    }

    return (
      new Date(b.dataRegistro).getTime() -
      new Date(a.dataRegistro).getTime()
    );
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => carregarEventos(true)}
          tintColor="#38BDF8"
        />
      }
    >
      <Text style={styles.titulo}>
        Eventos Urbanos
      </Text>

      <Text style={styles.subtitulo}>
        Ocorrências registradas na plataforma
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
            placeholder="Pesquisar evento, tipo ou localização..."
            placeholderTextColor="#94A3B8"
            value={pesquisa}
            onChangeText={setPesquisa}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Pesquisar eventos"
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

          {/* Contador */}
          <Text style={styles.contador}>
            {eventosOrdenados.length} evento(s) encontrado(s)
          </Text>

          {/* Lista de eventos */}
          {eventosOrdenados.length === 0 ? (
            <Text style={styles.vazio}>
              Nenhum evento encontrado para esta pesquisa
              ou filtro.
            </Text>
          ) : (
            eventosOrdenados.map((evento) => (
              <View
                key={evento.id}
                style={styles.card}
              >
                <View style={styles.linha}>
                  <Text style={styles.nome}>
                    {evento.titulo}
                  </Text>

                  <View
                    style={[
                      styles.etiqueta,
                      {
                        backgroundColor: corSeveridade(
                          evento.severidade
                        )
                      }
                    ]}
                  >
                    <Text style={styles.etiquetaTexto}>
                      {evento.severidade}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detalhe}>
                  ID: {evento.id}
                </Text>

                <Text style={styles.detalhe}>
                  Tipo: {evento.tipo}
                </Text>

                <Text style={styles.detalhe}>
                  Localização:{" "}
                  {evento.localizacao || "Não informada"}
                </Text>

                {evento.descricao && (
                  <Text style={styles.detalhe}>
                    Descrição: {evento.descricao}
                  </Text>
                )}

                <Text style={styles.detalhe}>
                  Origem: {evento.origem}
                </Text>

                <Text style={styles.detalhe}>
                  Confiança: {evento.confianca}%
                </Text>

                <Text style={styles.detalhe}>
                  Registrado em:{" "}
                  {formatarData(evento.dataRegistro)}
                </Text>

                <Text
                  style={[
                    styles.statusEvento,
                    {
                      color:
                        evento.status === "ATIVO"
                          ? "#F87171"
                          : "#4ADE80"
                    }
                  ]}
                >
                  Status: {evento.status}
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

  linha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },

  etiquetaTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },

  detalhe: {
    color: "#CBD5E1",
    fontSize: 14,
    marginBottom: 8
  },

  statusEvento: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8
  },

  vazio: {
    color: "#94A3B8",
    marginTop: 20
  }
});
