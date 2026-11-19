
package com.urbanrisk.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.urbanrisk.model.DadoClimatico;
import com.urbanrisk.repository.DadoClimaticoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dados-publicos")
public class DadosPublicosController {

    private final RestClient cliente = RestClient.create();
    private final DadoClimaticoRepository repositorio;

    public DadosPublicosController(
            DadoClimaticoRepository repositorio) {
        this.repositorio = repositorio;
    }

    private JsonNode consultarFonte() {
        try {
            JsonNode dados = cliente.get()
                .uri(uriBuilder -> uriBuilder
                    .scheme("https")
                    .host("api.open-meteo.com")
                    .path("/v1/forecast")
                    .queryParam("latitude", -23.5505)
                    .queryParam("longitude", -46.6333)
                    .queryParam(
                        "current",
                        "temperature_2m,precipitation"
                    )
                    .queryParam(
                        "timezone",
                        "America/Sao_Paulo"
                    )
                    .build())
                .retrieve()
                .body(JsonNode.class);

            if (dados == null || !dados.has("current")) {
                throw new IllegalStateException(
                    "Resposta meteorológica inválida"
                );
            }

            return dados;

        } catch (Exception erro) {
            erro.printStackTrace();

            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Não foi possível consultar a fonte pública",
                erro
            );
        }
    }

    @GetMapping("/clima")
    public Map<String, Object> consultarClima() {
        JsonNode dados = consultarFonte();

        return Map.of(
            "origem", "OPEN_METEO",
            "localizacao", "São Paulo - SP",
            "tipo", "DADOS_METEOROLOGICOS",
            "dados", dados
        );
    }

    @PostMapping("/clima/atualizar")
    public DadoClimatico atualizarClima() {

        JsonNode dados = consultarFonte();
        JsonNode atual = dados.path("current");

        if (!atual.hasNonNull("time")
                || !atual.hasNonNull("temperature_2m")
                || !atual.hasNonNull("precipitation")) {

            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Dados meteorológicos incompletos"
            );
        }

        LocalDateTime dataLeitura = LocalDateTime.parse(
            atual.path("time").asText()
        );

        DadoClimatico registro = repositorio
            .findFirstByDataLeituraOrderByIdDesc(dataLeitura)
            .orElseGet(DadoClimatico::new);

        registro.setOrigem("OPEN_METEO");
        registro.setLocalizacao("São Paulo - SP");
        registro.setTemperatura(
            atual.path("temperature_2m").asDouble()
        );
        registro.setPrecipitacao(
            atual.path("precipitation").asDouble()
        );
        registro.setDataLeitura(dataLeitura);
        registro.setRegistradoEm(LocalDateTime.now());

        return repositorio.save(registro);
    }

    @GetMapping("/clima/historico")
    public List<DadoClimatico> consultarHistorico() {
        return repositorio
            .findTop20ByOrderByRegistradoEmDesc();
    }
}
