
package com.urbanrisk.service;

import com.urbanrisk.controller.DadosPublicosController;
import com.urbanrisk.model.DadoClimatico;

import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@EnableScheduling
public class ColetaClimaticaService {

    private final DadosPublicosController dadosPublicosController;

    public ColetaClimaticaService(
            DadosPublicosController dadosPublicosController) {
        this.dadosPublicosController = dadosPublicosController;
    }

    @Scheduled(
        initialDelay = 15000,
        fixedDelay = 900000
    )
    public void executarColetaAutomatica() {

        try {
            System.out.println(
                "[COLETA CLIMATICA] Iniciando coleta..."
            );

            DadoClimatico dado =
                dadosPublicosController.atualizarClima();

            System.out.println(
                "[COLETA CLIMATICA] Leitura salva com sucesso!"
            );

            System.out.println(
                "ID: " + dado.getId()
            );

            System.out.println(
                "Temperatura: " + dado.getTemperatura() + " °C"
            );

            System.out.println(
                "Precipitacao: " + dado.getPrecipitacao() + " mm"
            );

        } catch (Exception erro) {

            System.err.println(
                "[COLETA CLIMATICA] Falha na coleta: "
                + erro.getMessage()
            );
        }
    }
}
