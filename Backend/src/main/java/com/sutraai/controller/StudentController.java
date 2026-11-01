package com.sutraai.controller;

import com.sutraai.model.User;
import com.sutraai.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final UserRepository userRepository;

    public StudentController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getStudentsByClass(@RequestParam(defaultValue = "Class 8") String classGroup) {
        return userRepository.findByClassGroup(classGroup);
    }

    @PostMapping
    public ResponseEntity<User> createStudent(@RequestBody User student) {
        if (student.getRole() == null) student.setRole("student");
        User saved = userRepository.save(student);
        return ResponseEntity.ok(saved);
    }
}
