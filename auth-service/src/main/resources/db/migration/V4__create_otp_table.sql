CREATE TABLE otp_verifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    otp_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    verified_at TIMESTAMP(6),
    last_sent_at TIMESTAMP(6) NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    KEY idx_otp_email_purpose_created (email, purpose, created_at)
);
