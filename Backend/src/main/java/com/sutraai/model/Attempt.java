package com.sutraai.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String questionId;
    private String subject;
    private String chapter;
    private Integer difficultyLevel;
    private Boolean isCorrect;
    private Integer responseSeconds;
    private Boolean timedOut;
    private LocalDateTime createdAt = LocalDateTime.now();
}
