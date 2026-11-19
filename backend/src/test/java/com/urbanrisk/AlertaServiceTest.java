
package com.urbanrisk;

import com.urbanrisk.model.Evento;
import com.urbanrisk.repository.AlertaRepository;
import com.urbanrisk.service.AlertaService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class AlertaServiceTest {

    private AlertaService alertaService;

    @BeforeEach
    void configurar() {
        AlertaRepository repository =
                Mockito.mock(AlertaRepository.class);

        alertaService = new AlertaService(repository);
    }

    private Evento criarEvento() {
        Evento evento = new Evento();

        evento.setTitulo("Alagamento simulado");
        evento.setTipo("ALAGAMENTO");
        evento.setDescricao("Teste de risco urbano");
        evento.setLatitude(-23.5614);
        evento.setLongitude(-46.6559);
        evento.setSeveridade("ALTA");
        evento.setOrigem("SIMULACAO");
        evento.setConfianca(95.0);
        evento.setPopulacaoAfetada(800);
        evento.setStatus("ATIVO");
        evento.setDataRegistro(LocalDateTime.now());

        return evento;
    }

    @Test
    void deveCalcularPontuacaoCorretamente() {
        Evento evento = criarEvento();

        double resultado = alertaService.calcularRisco(evento);

        assertEquals(94.5, resultado, 0.01);
    }

    @Test
    void deveClassificarRiscoAlto() {
        assertEquals(
                "ALTA",
                alertaService.classificarPrioridade(94.5)
        );
    }

    @Test
    void deveClassificarRiscoMedio() {
        assertEquals(
                "MEDIA",
                alertaService.classificarPrioridade(55.0)
        );
    }

    @Test
    void deveClassificarRiscoBaixo() {
        assertEquals(
                "BAIXA",
                alertaService.classificarPrioridade(25.0)
        );
    }

    @Test
    void deveValidarLimitesDePrioridade() {
        assertEquals(
                "MEDIA",
                alertaService.classificarPrioridade(40.0)
        );

        assertEquals(
                "ALTA",
                alertaService.classificarPrioridade(70.0)
        );
    }
}
