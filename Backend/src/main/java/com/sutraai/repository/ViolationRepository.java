package com.sutraai.repository;

import com.sutraai.model.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findByClassGroup(String classGroup);
}
