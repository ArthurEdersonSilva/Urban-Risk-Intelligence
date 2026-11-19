
package com.urbanrisk.repository;

import com.urbanrisk.model.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    List<Alerta> findByStatusOrderByPontuacaoRiscoDesc(String status);

    List<Alerta> findAllByOrderByPontuacaoRiscoDesc();

    Optional<Alerta> findFirstByEventoIdAndStatus(
        Long eventoId,
        String status
    );
}
