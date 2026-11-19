
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform
} from "react-native";

import * as Location from "expo-location";

import {
  cadastrarOcorrencia,
  NovaOcorrencia
} from "../services/api";

type Coordenadas = {
  latitude: number;
  longitude: number;
};

export default function CadastroOcorrenciaScreen() {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("ALAGAMENTO");
  const [descricao, setDescricao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [referencia, setReferencia] = useState("");

  const [coordenadas, setCoordenadas] =
    useState<Coordenadas | null>(null);

  const [localizando, setLocalizando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Obtém coordenadas e tenta preencher o endereço
  async function obterLocalizacao() {
    setLocalizando(true);
    setMensagem("");
    setSucesso(false);
    setCoordenadas(null);

    try {
      const permissao =
        await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== "granted") {
        setMensagem(
          "Permissão de localização negada. " +
          "Autorize o acesso à localização."
        );
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const latitude = posicao.coords.latitude;
      const longitude = posicao.coords.longitude;

      setCoordenadas({
        latitude,
        longitude
      });

      let rua = "";
      let numero = "";
      let bairro = "";
      let cidade = "";
      let estado = "";

      try {
        if (Platform.OS === "web") {
          // Consulta o endereço no OpenStreetMap
          const url =
            "https://nominatim.openstreetmap.org/reverse" +
            "?format=jsonv2" +
            "&addressdetails=1" +
            "&accept-language=pt-BR" +
            "&lat=" + encodeURIComponent(latitude) +
            "&lon=" + encodeURIComponent(longitude);

          const resposta = await fetch(url);

          if (!resposta.ok) {
            throw new Error(
              "Serviço de localização indisponível"
            );
          }

          const dados = await resposta.json();
          const enderecoGPS = dados.address || {};

          rua =
            enderecoGPS.road ||
            enderecoGPS.pedestrian ||
            enderecoGPS.residential ||
            "";

          numero =
            enderecoGPS.house_number || "";

          bairro =
            enderecoGPS.suburb ||
            enderecoGPS.neighbourhood ||
            enderecoGPS.city_district ||
            "";

          cidade =
            enderecoGPS.city ||
            enderecoGPS.town ||
            enderecoGPS.municipality ||
            enderecoGPS.village ||
            "";

          estado =
            enderecoGPS.state || "";

        } else {
          // Geocodificação nativa para Android e iOS
          const enderecos =
            await Location.reverseGeocodeAsync({
              latitude,
              longitude
            });

          const encontrado = enderecos[0];

          if (encontrado) {
            rua = encontrado.street || "";
            numero = encontrado.streetNumber || "";
            bairro = encontrado.district || "";
            cidade = encontrado.city || "";
            estado = encontrado.region || "";
          }
        }

        const enderecoCompleto = [
          rua,
          numero,
          bairro,
          cidade,
          estado
        ]
          .filter(Boolean)
          .join(", ");

        if (enderecoCompleto) {
          setEndereco(enderecoCompleto);

          setMensagem(
            "Localização e endereço obtidos. " +
            "Confira os dados antes de registrar."
          );

          setSucesso(true);
        } else {
          setMensagem(
            "Localização obtida, mas o endereço " +
            "não foi encontrado. Preencha a rua manualmente."
          );
        }

      } catch {
        setMensagem(
          "Localização obtida, mas não foi possível " +
          "consultar o endereço. Preencha a rua manualmente."
        );
      }

    } catch {
      setMensagem(
        "Não foi possível obter sua localização. " +
        "Verifique as permissões do dispositivo ou navegador."
      );
    } finally {
      setLocalizando(false);
    }
  }

  // Valida e envia a ocorrência ao backend
  async function salvarOcorrencia() {
    setMensagem("");
    setSucesso(false);

    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !endereco.trim()
    ) {
      setMensagem(
        "Preencha o título, a descrição e o endereço."
      );
      return;
    }

    if (!coordenadas) {
      setMensagem(
        "Clique em 'Usar minha localização' " +
        "antes de registrar a ocorrência."
      );
      return;
    }

    const localizacaoCompleta = referencia.trim()
      ? `${endereco.trim()} - Referência: ${referencia.trim()}`
      : endereco.trim();

    const ocorrencia: NovaOcorrencia = {
      titulo: titulo.trim(),
      tipo,
      descricao: descricao.trim(),
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
      localizacao: localizacaoCompleta,
      severidade: "MEDIA",
      origem: "COMUNIDADE",
      confianca: 50,
      populacaoAfetada: 0
    };

    setEnviando(true);

    try {
      await cadastrarOcorrencia(ocorrencia);

      // Limpa o formulário após o cadastro
      setTitulo("");
      setTipo("ALAGAMENTO");
      setDescricao("");
      setEndereco("");
      setReferencia("");
      setCoordenadas(null);

      setMensagem(
        "Ocorrência registrada com sucesso!"
      );

      setSucesso(true);

    } catch {
      setMensagem(
        "Erro ao registrar ocorrência. " +
        "Verifique a conexão com a API."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>
        Registrar Ocorrência
      </Text>

      <Text style={styles.subtitulo}>
        Informe um risco identificado na sua região.
      </Text>

      {/* Título */}
      <Text style={styles.label}>
        Título da ocorrência
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: Alagamento na rua"
        placeholderTextColor="#94A3B8"
        value={titulo}
        onChangeText={setTitulo}
        maxLength={120}
        accessibilityLabel="Título da ocorrência"
      />

      {/* Tipo */}
      <Text style={styles.label}>
        Tipo de ocorrência
      </Text>

      <View style={styles.tipos}>
        {[
          ["ALAGAMENTO", "Alagamento"],
          ["ILHA_DE_CALOR", "Ilha de calor"],
          ["INTERRUPCAO_SERVICO", "Serviço essencial"]
        ].map(([valor, nome]) => (
          <TouchableOpacity
            key={valor}
            onPress={() => setTipo(valor)}
            accessibilityRole="button"
            accessibilityState={{
              selected: tipo === valor
            }}
            style={[
              styles.tipoBotao,
              tipo === valor && styles.selecionado
            ]}
          >
            <Text style={styles.botaoTexto}>
              {nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Descrição */}
      <Text style={styles.label}>
        Descrição
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.descricao
        ]}
        placeholder="Descreva o que está acontecendo"
        placeholderTextColor="#94A3B8"
        multiline
        value={descricao}
        onChangeText={setDescricao}
        maxLength={1000}
        accessibilityLabel="Descrição da ocorrência"
      />

      {/* Endereço */}
      <Text style={styles.label}>
        Endereço ou nome da rua
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Será preenchido pela localização"
        placeholderTextColor="#94A3B8"
        value={endereco}
        onChangeText={setEndereco}
        maxLength={200}
        accessibilityLabel="Endereço da ocorrência"
      />

      {/* Referência */}
      <Text style={styles.label}>
        Número próximo ou ponto de referência
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: Próximo ao número 250"
        placeholderTextColor="#94A3B8"
        value={referencia}
        onChangeText={setReferencia}
        maxLength={200}
        accessibilityLabel="Ponto de referência"
      />

      {/* Localização automática */}
      <Text style={styles.label}>
        Localização da ocorrência
      </Text>

      <TouchableOpacity
        style={[
          styles.botaoLocalizacao,
          (localizando || enviando) &&
            styles.botaoDesabilitado
        ]}
        onPress={obterLocalizacao}
        disabled={localizando || enviando}
        accessibilityRole="button"
      >
        {localizando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botaoTexto}>
            Usar minha localização
          </Text>
        )}
      </TouchableOpacity>

      {/* Confirmação da localização */}
      <View style={styles.localizacaoStatus}>
        <Text style={styles.localizacaoTexto}>
          {coordenadas
            ? "Localização obtida com sucesso"
            : "Localização ainda não informada"}
        </Text>
      </View>

      <Text style={styles.observacao}>
        A localização é obtida somente com sua
        autorização. Verifique se você está próximo
        da ocorrência antes de registrar.
        O endereço pode ser aproximado e deve ser
        conferido.
      </Text>

      <Text style={styles.observacao}>
        Registro comunitário não verificado:
        confiança inicial de 50% e severidade média.
        Não inclua dados pessoais na descrição.
      </Text>

      {/* Botão de cadastro */}
      <TouchableOpacity
        style={[
          styles.botaoSalvar,
          (enviando || localizando) &&
            styles.botaoDesabilitado
        ]}
        onPress={salvarOcorrencia}
        disabled={enviando || localizando}
        accessibilityRole="button"
      >
        {enviando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.salvarTexto}>
            Registrar ocorrência
          </Text>
        )}
      </TouchableOpacity>

      {/* Mensagens */}
      {mensagem !== "" && (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.mensagem,
            sucesso
              ? styles.mensagemSucesso
              : styles.mensagemErro
          ]}
        >
          {mensagem}
        </Text>
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

  label: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8
  },

  input: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    fontSize: 15
  },

  descricao: {
    minHeight: 100,
    textAlignVertical: "top"
  },

  tipos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20
  },

  tipoBotao: {
    padding: 11,
    borderRadius: 8,
    backgroundColor: "#334155"
  },

  selecionado: {
    backgroundColor: "#0369A1"
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center"
  },

  botaoLocalizacao: {
    backgroundColor: "#0369A1",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12
  },

  localizacaoStatus: {
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 8,
    marginBottom: 18
  },

  localizacaoTexto: {
    color: "#CBD5E1",
    fontSize: 13
  },

  observacao: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 16
  },

  botaoSalvar: {
    backgroundColor: "#0284C7",
    padding: 16,
    borderRadius: 10,
    alignItems: "center"
  },

  botaoDesabilitado: {
    opacity: 0.6
  },

  salvarTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },

  mensagem: {
    fontSize: 14,
    marginTop: 16,
    textAlign: "center"
  },

  mensagemSucesso: {
    color: "#4ADE80"
  },

  mensagemErro: {
    color: "#FCA5A5"
  }
});
