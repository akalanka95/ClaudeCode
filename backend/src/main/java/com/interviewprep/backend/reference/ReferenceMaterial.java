package com.interviewprep.backend.reference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "reference_material")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceMaterial {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "node_id", nullable = false)
    private UUID nodeId;

    @Column(name = "url", nullable = false, columnDefinition = "text")
    private String url;

    @Column(name = "title")
    private String title;

    @Column(name = "preview_title", length = 500)
    private String previewTitle;

    @Column(name = "preview_description", columnDefinition = "text")
    private String previewDescription;

    @Column(name = "preview_image_url", columnDefinition = "text")
    private String previewImageUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
