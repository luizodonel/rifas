package com.rifasonline.repository;

import com.rifasonline.model.Rifa;
import com.rifasonline.model.StatusRifa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RifaRepository extends JpaRepository<Rifa, Long> {
    List<Rifa> findAllByOrderByCreatedAtDesc();
    List<Rifa> findByStatusOrderByCreatedAtDesc(StatusRifa status);
    List<Rifa> findByStatusInOrderByCreatedAtDesc(List<StatusRifa> statuses);
    List<Rifa> findByStatusAndDataHoraSorteioBefore(StatusRifa status, LocalDateTime dataHora);
}
