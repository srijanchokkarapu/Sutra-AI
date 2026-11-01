package com.sutraai.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String identifier; // Roll No (STU001) or Teacher ID (T001)

    private String name;
    private String displayName;
    
    @Column(nullable = false)
    private String role; // "student" or "teacher"
    
    private String classGroup; // "Class 6", "Class 8", etc.
    private Integer points = 120;
    private Integer xp = 1000;
}
