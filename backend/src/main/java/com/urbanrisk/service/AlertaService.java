
package com.urbanrisk.service;

import com.urbanrisk.model.Alerta;
import com.urbanrisk.model.Evento;
import com.urbanrisk.repository.AlertaRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class AlertaService {

    private final AlertaRepository repository;

    public AlertaService(AlertaRepository repository) {
        this.repository = repository;
    }

    public List<Alerta> listarTodos() {
        return repository.findAllByOrderByPontuacaoRiscoDesc();
    }

    public List<Alerta> listarAtivos() {
        return repository
                .findByStatusOrderByPontuacaoRiscoDesc("ATIVO");
    }

    public Alerta buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Alerta não encontrado: " + id));
    }

    // ALGORITMO DE PRIORIZAÇÃO DOS RISCOS
    public double calcularRisco(Evento evento) {

        double severidade = switch (
                evento.getSeveridade().toUpperCase()) {
            case "ALTA", "CRITICA" -> 100.0;
            case "MEDIA" -> 60.0;
            case "BAIXA" -> 25.0;
            default -> 0.0;
        };

        double confianca = Math.max(
                0.0,
                Math.min(100.0, evento.getConfianca())
        );

        int populacao = evento.getPopulacaoAfetada() == null
                ? 0
                : Math.max(0, evento.getPopulacaoAfetada());

        double impacto = Math.min(
                100.0,
                (populacao / 1000.0) * 100.0
        );

        long horas = Math.max(
                0,
                Duration.between(
                        evento.getDataRegistro() == null
                                ? LocalDateTime.now()
                                : evento.getDataRegistro(),
                        LocalDateTime.now()
                ).toHours()
        );

        double recencia;

        if (horas <= 1) {
            recencia = 100.0;
        } else if (horas <= 6) {
            recencia = 80.0;
        } else if (horas <= 24) {
            recencia = 50.0;
        } else {
            recencia = 20.0;
        }

        double pontuacao =
                (severidade * 0.40) +
                (confianca * 0.30) +
                (impacto * 0.20) +
                (recencia * 0.10);

        return Math.round(pontuacao * 100.0) / 100.0;
    }

    public String classificarPrioridade(double pontuacao) {

        if (pontuacao >= 70) {
            return "ALTA";
        }

        if (pontuacao >= 40) {
            return "MEDIA";
        }

        return "BAIXA";
    }

    public Alerta processarEvento(Evento evento) {

        if (!"ATIVO".equals(evento.getStatus())) {
            return null;
        }

        double pontuacao = calcularRisco(evento);
        String prioridade = classificarPrioridade(pontuacao);

        Alerta alerta = repository
                .findFirstByEventoIdAndStatus(
                        evento.getId(), "ATIVO")
                .orElseGet(Alerta::new);

        alerta.setEvento(evento);
        alerta.setTitulo(evento.getTitulo());

        alerta.setMensagem(
                "Risco urbano identificado: "
                        + evento.getDescricao()
        );

        alerta.setPontuacaoRisco(pontuacao);
        alerta.setPrioridade(prioridade);
        alerta.setOrigem(evento.getOrigem());
        alerta.setConfianca(evento.getConfianca());
        alerta.setStatus("ATIVO");

        return repository.save(alerta);
    }

    public void resolverAlertasDoEvento(Long eventoId) {

        List<Alerta> alertas = repository.findAll()
                .stream()
                .filter(a ->
                        a.getEvento().getId().equals(eventoId)
                                && "ATIVO".equals(a.getStatus()))
                .toList();

        for (Alerta alerta : alertas) {
            alerta.setStatus("RESOLVIDO");
        }

        repository.saveAll(alertas);
    }
}
