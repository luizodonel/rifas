package com.rifasonline.repository;

import com.rifasonline.model.Pedido;
import com.rifasonline.model.Rifa;
import com.rifasonline.model.StatusPagamento;
import com.rifasonline.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    Optional<Pedido> findByCodigoPedido(String codigoPedido);
    List<Pedido> findByUsuarioOrderByDataCompraDesc(Usuario usuario);
    List<Pedido> findByRifaAndStatusPagamento(Rifa rifa, StatusPagamento status);
}

