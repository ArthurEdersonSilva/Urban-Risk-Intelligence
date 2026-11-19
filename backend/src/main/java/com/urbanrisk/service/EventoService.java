
package com.urbanrisk.service;

import com.urbanrisk.model.Evento;
import com.urbanrisk.repository.EventoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EventoService {

    private final EventoRepository repository;
    private final AlertaService alertaService;

    public EventoService(
            EventoRepository repository,
            AlertaService alertaService) {

        this.repository = repository;
        this.alertaService = alertaService;
    }

    public List<Evento> listarTodos() {
        return repository.findAllByOrderByDataRegistroDesc();
    }

    public List<Evento> listarAtivos() {
        return repository.findByStatus("ATIVO");
    }

    public List<Evento> listarPorTipo(String tipo) {
        return repository.findByTipo(tipo);
    }

    public Evento buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Evento não encontrado: " + id));
    }

    public Evento salvar(Evento evento) {
        Evento salvo = repository.save(evento);

        alertaService.processarEvento(salvo);

        return salvo;
    }

    public Evento atualizarStatus(Long id, String status) {
        if (!List.of("ATIVO", "RESOLVIDO")
                .contains(status)) {
            throw new IllegalArgumentException(
                    "Status deve ser ATIVO ou RESOLVIDO.");
        }

        Evento evento = buscarPorId(id);
        evento.setStatus(status);

        Evento salvo = repository.save(evento);

        if ("RESOLVIDO".equals(status)) {
            alertaService.resolverAlertasDoEvento(id);
        } else {
            alertaService.processarEvento(salvo);
        }

        return salvo;
    }
}
