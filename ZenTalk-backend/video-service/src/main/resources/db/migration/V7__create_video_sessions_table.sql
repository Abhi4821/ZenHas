CREATE TABLE IF NOT EXISTS video_sessions
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    user_a VARCHAR(40) NOT NULL,
    user_b VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL,
    end_reason VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,

    CONSTRAINT fk_video_sessions_user_a
        FOREIGN KEY (user_a) REFERENCES users(user_id),
    CONSTRAINT fk_video_sessions_user_b
        FOREIGN KEY (user_b) REFERENCES users(user_id)
);

CREATE INDEX idx_video_sessions_user_a ON video_sessions(user_a);
CREATE INDEX idx_video_sessions_user_b ON video_sessions(user_b);
CREATE INDEX idx_video_sessions_status ON video_sessions(status);
CREATE INDEX idx_video_sessions_created_at ON video_sessions(created_at);
