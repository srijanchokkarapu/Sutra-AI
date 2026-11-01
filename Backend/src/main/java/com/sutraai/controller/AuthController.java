package com.sutraai.controller;

import com.sutraai.model.User;
import com.sutraai.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String identifier = request.get("identifier");
        String role = request.get("role");

        Optional<User> userOpt = userRepository.findByIdentifier(identifier);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }

        // Auto-seed for quick testing if not exists
        User newStudent = User.builder()
                .identifier(identifier)
                .name("Student " + identifier)
                .displayName(identifier)
                .role(role != null ? role : "student")
                .classGroup("Class 8")
                .points(150)
                .xp(1200)
                .build();
        User saved = userRepository.save(newStudent);
        return ResponseEntity.ok(saved);
    }
}
