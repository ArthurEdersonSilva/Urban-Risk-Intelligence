
package com.urbanrisk.repository;

import com.urbanrisk.model.DadoClimatico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DadoClimaticoRepository
        extends JpaRepository<DadoClimatico, Long> {

    List<DadoClimatico> findTop20ByOrderByRegistradoEmDesc();

    Optional<DadoClimatico> findFirstByDataLeituraOrderByIdDesc(
        LocalDateTime dataLeitura
    );
}
