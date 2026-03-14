package com.neria.presupuestos.repository.product;

import com.neria.presupuestos.model.entity.OptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OptionValueRepository extends JpaRepository<OptionValue, String> {
    List<OptionValue> findByOptionId(String optionId);

    void deleteByOptionIdIn(List<String> optionIds);
}
