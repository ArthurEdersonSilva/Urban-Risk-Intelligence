
package com.urbanrisk.service;

import com.urbanrisk.model.Evento;
import com.urbanrisk.model.Sensor;
import com.urbanrisk.repository.EventoRepository;
import com.urbanrisk.repository.SensorRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class SensorService {

    private final SensorRepository repository;
    private final EventoRepository eventoRepository;
    private final EventoService eventoService;

    public SensorService(
            SensorRepository repository,
            EventoRepository eventoRepository,
            EventoService eventoService) {

        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.eventoService = eventoService;
    }

    public List<Sensor> listarTodos() {
        return repository.findAll();
    }

    public List<Sensor> listarAtivos() {
        return repository.findByAtivoTrue();
    }

    public Sensor buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Sensor não encontrado: " + id));
    }

    public Sensor salvar(Sensor sensor) {
        return repository.save(sensor);
    }

    @Transactional
    public Sensor atualizarLeitura(Long id, Double valor) {

        if (valor == null || !Double.isFinite(valor)) {
            throw new IllegalArgumentException(
                    "Valor da leitura inválido.");
        }

        Sensor sensor = buscarPorId(id);

        if (!Boolean.TRUE.equals(sensor.getAtivo())) {
            throw new IllegalArgumentException(
                    "Sensor desativado.");
        }

        sensor.setValor(valor);
        Sensor atualizado = repository.save(sensor);

        verificarRisco(atualizado);

        return atualizado;
    }

    private void verificarRisco(Sensor sensor) {

        String tipo = sensor.getTipo().toUpperCase();

        String tipoEvento;
        String titulo;
        String descricao;
        String severidade;

        switch (tipo) {

            case "TEMPERATURA":

                tipoEvento = "ILHA_DE_CALOR";

                if (sensor.getValor() < 35.0) {
                    resolverEvento(sensor.getId(), tipoEvento);
                    return;
                }

                titulo = "Temperatura elevada detectada";
                descricao = "Sensor " + sensor.getNome()
                        + " registrou "
                        + sensor.getValor() + " °C";

                severidade = sensor.getValor() >= 40.0
                        ? "ALTA" : "MEDIA";
                break;

            case "NIVEL_AGUA":

                tipoEvento = "ALAGAMENTO";

                if (sensor.getValor() < 50.0) {
                    resolverEvento(sensor.getId(), tipoEvento);
                    return;
                }

                titulo = "Risco de alagamento detectado";
                descricao = "Sensor " + sensor.getNome()
                        + " registrou nível de água de "
                        + sensor.getValor() + " cm";

                severidade = sensor.getValor() >= 80.0
                        ? "ALTA" : "MEDIA";
                break;

            default:
                return;
        }

        Evento evento = eventoRepository
                .findFirstBySensorIdAndTipoAndStatus(
                        sensor.getId(),
                        tipoEvento,
                        "ATIVO"
                )
                .orElseGet(Evento::new);

        evento.setSensorId(sensor.getId());
        evento.setTitulo(titulo);
        evento.setTipo(tipoEvento);
        evento.setDescricao(descricao);
        evento.setLatitude(sensor.getLatitude());
        evento.setLongitude(sensor.getLongitude());
        evento.setLocalizacao(sensor.getNome());
        evento.setSeveridade(severidade);
        evento.setOrigem(sensor.getOrigem());
        evento.setConfianca(sensor.getConfianca());
        evento.setPopulacaoAfetada(
                evento.getPopulacaoAfetada() == null
                        ? 0
                        : evento.getPopulacaoAfetada()
        );
        evento.setStatus("ATIVO");

        eventoService.salvar(evento);
    }

    private void resolverEvento(
            Long sensorId,
            String tipoEvento) {

        eventoRepository
                .findFirstBySensorIdAndTipoAndStatus(
                        sensorId,
                        tipoEvento,
                        "ATIVO"
                )
                .ifPresent(evento ->
                        eventoService.atualizarStatus(
                                evento.getId(),
                                "RESOLVIDO"
                        )
                );
    }
}
