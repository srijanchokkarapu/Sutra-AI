package com.sutraai.repository;

import com.sutraai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByIdentifier(String identifier);
    List<User> findByClassGroup(String classGroup);
}
