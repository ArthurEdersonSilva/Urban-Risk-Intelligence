
package com.urbanrisk.controller;

import com.urbanrisk.model.Sensor;
import com.urbanrisk.service.SensorService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensores")
@CrossOrigin(origins = "*")
public class SensorController {

    private final SensorService service;

    public SensorController(SensorService service) {
        this.service = service;
    }

    @GetMapping
    public List<Sensor> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/ativos")
    public List<Sensor> listarAtivos() {
        return service.listarAtivos();
    }

    @GetMapping("/{id}")
    public Sensor buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Sensor cadastrar(@Valid @RequestBody Sensor sensor) {
        return service.salvar(sensor);
    }

    @PatchMapping("/{id}/leitura")
    public Sensor atualizarLeitura(
            @PathVariable Long id,
            @RequestBody AtualizacaoLeitura dados) {

        return service.atualizarLeitura(id, dados.valor());
    }

    public record AtualizacaoLeitura(
            @jakarta.validation.constraints.NotNull
            Double valor
    ) {}
}
