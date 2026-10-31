package com.rifasonline.repository;

import com.rifasonline.model.MensagemChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensagemChatRepository extends JpaRepository<MensagemChat, Long> {

    List<MensagemChat> findBySessaoIdOrderByCreatedAtAsc(String sessaoId);

    @Query("SELECT DISTINCT m.sessaoId FROM MensagemChat m ORDER BY m.sessaoId")
    List<String> findDistinctSessaoIds();

    long countByLidaFalseAndRemetenteAdminFalse();

    long countBySessaoIdAndLidaFalseAndRemetenteAdminFalse(String sessaoId);

    MensagemChat findTop1BySessaoIdOrderByCreatedAtDesc(String sessaoId);
}
