
import React, { useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from "react-native";

import DashboardScreen from "./src/screens/DashboardScreen";
import EventosScreen from "./src/screens/EventosScreen";
import AlertasScreen from "./src/screens/AlertasScreen";
import CadastroOcorrenciaScreen from "./src/screens/CadastroOcorrenciaScreen";

type Tela = "dashboard" | "eventos" | "alertas" | "registrar";

export default function App() {
  const [telaAtual, setTelaAtual] = useState<Tela>("dashboard");

  function renderizarTela() {
    switch (telaAtual) {
      case "eventos":
        return <EventosScreen />;

      case "alertas":
        return <AlertasScreen />;

      case "registrar":
        return <CadastroOcorrenciaScreen />;

      default:
        return <DashboardScreen />;
    }
  }

  const abas: { id: Tela; nome: string }[] = [
    { id: "dashboard", nome: "Dashboard" },
    { id: "eventos", nome: "Eventos" },
    { id: "alertas", nome: "Alertas" },
    { id: "registrar", nome: "Registrar" }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>
          Urban Risk Intelligence
        </Text>
      </View>

      <View style={styles.conteudo}>
        {renderizarTela()}
      </View>

      <View style={styles.menu}>
        {abas.map((aba) => (
          <TouchableOpacity
            key={aba.id}
            style={[
              styles.botao,
              telaAtual === aba.id && styles.botaoAtivo
            ]}
            onPress={() => setTelaAtual(aba.id)}
            accessibilityRole="tab"
            accessibilityState={{
              selected: telaAtual === aba.id
            }}
          >
            <Text
              style={[
                styles.textoBotao,
                telaAtual === aba.id && styles.textoAtivo
              ]}
            >
              {aba.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A"
  },

  cabecalho: {
    backgroundColor: "#1E293B",
    padding: 20,
    paddingTop: 36
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold"
  },

  conteudo: {
    flex: 1
  },

  menu: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    padding: 8,
    gap: 4
  },

  botao: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8
  },

  botaoAtivo: {
    backgroundColor: "#0369A1"
  },

  textoBotao: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "bold"
  },

  textoAtivo: {
    color: "#FFFFFF"
  }
});
