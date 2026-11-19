
package com.urbanrisk.controller;

import com.urbanrisk.model.Alerta;
import com.urbanrisk.service.AlertaService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertas")
@CrossOrigin(origins = "*")
public class AlertaController {

    private final AlertaService service;

    public AlertaController(AlertaService service) {
        this.service = service;
    }

    @GetMapping
    public List<Alerta> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/ativos")
    public List<Alerta> listarAtivos() {
        return service.listarAtivos();
    }

    @GetMapping("/{id}")
    public Alerta buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }
}
