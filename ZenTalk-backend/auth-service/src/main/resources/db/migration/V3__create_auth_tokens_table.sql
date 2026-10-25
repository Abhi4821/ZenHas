CREATE TABLE auth_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_pk BIGINT NOT NULL,
    token_id VARCHAR(100) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    issued_at TIMESTAMP(6) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_auth_tokens_token_id (token_id),
    KEY idx_auth_tokens_user_pk (user_pk),
    CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_pk) REFERENCES users(id) ON DELETE CASCADE
);
