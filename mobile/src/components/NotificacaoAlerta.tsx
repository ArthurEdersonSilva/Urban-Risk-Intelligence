
import React from "react";
import {
  View,
  Text,
  StyleSheet
} from "react-native";

interface NotificacaoAlertaProps {
  titulo: string;
  mensagem: string;
  prioridade: string;
  localizacao?: string | null;
}

export default function NotificacaoAlerta({
  titulo,
  mensagem,
  prioridade,
  localizacao
}: NotificacaoAlertaProps) {
  if (prioridade !== "ALTA") {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.cabecalho}>
        ALERTA DE RISCO ALTO
      </Text>

      <Text style={styles.titulo}>
        {titulo}
      </Text>

      <Text style={styles.mensagem}>
        {mensagem}
      </Text>

      {localizacao && (
        <Text style={styles.localizacao}>
          Localização: {localizacao}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#7F1D1D",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16
  },

  cabecalho: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 10
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8
  },

  mensagem: {
    color: "#FEE2E2",
    fontSize: 14,
    lineHeight: 22
  },

  localizacao: {
    color: "#FECACA",
    fontSize: 13,
    marginTop: 10
  }
});
