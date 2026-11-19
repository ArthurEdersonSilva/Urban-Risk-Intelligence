
package com.urbanrisk.controller;

import com.urbanrisk.model.Evento;
import com.urbanrisk.service.EventoService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
@CrossOrigin(origins = "*")
public class EventoController {

    private final EventoService service;

    public EventoController(EventoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Evento> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/ativos")
    public List<Evento> listarAtivos() {
        return service.listarAtivos();
    }

    @GetMapping("/{id}")
    public Evento buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @GetMapping("/tipo/{tipo}")
    public List<Evento> listarPorTipo(
            @PathVariable String tipo) {

        return service.listarPorTipo(tipo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Evento cadastrar(
            @Valid @RequestBody Evento evento) {

        return service.salvar(evento);
    }

    @PatchMapping("/{id}/status")
    public Evento atualizarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AtualizacaoStatus dados) {

        return service.atualizarStatus(id, dados.status());
    }

    public record AtualizacaoStatus(
            @NotBlank
            @Pattern(regexp = "ATIVO|RESOLVIDO")
            String status
    ) {}
}
