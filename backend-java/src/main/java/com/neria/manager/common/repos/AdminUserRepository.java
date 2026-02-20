package com.neria.manager.common.repos;

import com.neria.manager.common.entities.AdminUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, String> {
  Optional<AdminUser> findByUsername(String username);

  List<AdminUser> findByRoleIgnoreCaseAndStatusIgnoreCase(String role, String status);
}
