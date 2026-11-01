package com.sutraai.controller;

import com.sutraai.model.Attempt;
import com.sutraai.model.User;
import com.sutraai.repository.AttemptRepository;
import com.sutraai.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attempts")
@CrossOrigin(origins = "*")
public class AttemptController {

    private final AttemptRepository attemptRepository;
    private final UserRepository userRepository;

    public AttemptController(AttemptRepository attemptRepository, UserRepository userRepository) {
        this.attemptRepository = attemptRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Attempt> submitAttempt(@RequestBody Attempt attempt) {
        Attempt saved = attemptRepository.save(attempt);

        // Award Points & XP to student
        if (attempt.getUserId() != null) {
            userRepository.findById(attempt.getUserId()).ifPresent(user -> {
                int pts = Boolean.TRUE.equals(attempt.getIsCorrect()) ? 10 : 2;
                user.setPoints((user.getPoints() != null ? user.getPoints() : 0) + pts);
                if (Boolean.TRUE.equals(attempt.getIsCorrect())) {
                    user.setXp((user.getXp() != null ? user.getXp() : 0) + 25);
                }
                userRepository.save(user);
            });
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public List<Attempt> getUserAttempts(@PathVariable Long userId) {
        return attemptRepository.findByUserId(userId);
    }
}
