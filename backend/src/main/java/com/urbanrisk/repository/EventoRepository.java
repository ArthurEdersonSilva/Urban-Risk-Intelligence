
package com.urbanrisk.repository;

import com.urbanrisk.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByStatus(String status);

    List<Evento> findByTipo(String tipo);

    List<Evento> findAllByOrderByDataRegistroDesc();

    Optional<Evento> findFirstBySensorIdAndTipoAndStatus(
            Long sensorId,
            String tipo,
            String status
    );
}
