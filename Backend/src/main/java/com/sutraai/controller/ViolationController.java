package com.sutraai.controller;

import com.sutraai.model.Violation;
import com.sutraai.repository.ViolationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/violations")
@CrossOrigin(origins = "*")
public class ViolationController {

    private final ViolationRepository violationRepository;

    public ViolationController(ViolationRepository violationRepository) {
        this.violationRepository = violationRepository;
    }

    @PostMapping
    public ResponseEntity<Violation> recordViolation(@RequestBody Violation violation) {
        Violation saved = violationRepository.save(violation);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Violation> getViolationsByClass(@RequestParam(defaultValue = "Class 8") String classGroup) {
        return violationRepository.findByClassGroup(classGroup);
    }
}
