ALTER TABLE reference_material
    ADD COLUMN preview_title       VARCHAR(500) NULL,
    ADD COLUMN preview_description TEXT NULL,
    ADD COLUMN preview_image_url  TEXT NULL;
