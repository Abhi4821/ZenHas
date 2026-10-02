CREATE TABLE IF NOT EXISTS video_requests
(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL UNIQUE,
    sender_user_id VARCHAR(40) NOT NULL,
    receiver_user_id VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_video_requests_sender
        FOREIGN KEY (sender_user_id) REFERENCES users(user_id),
    CONSTRAINT fk_video_requests_receiver
        FOREIGN KEY (receiver_user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_video_requests_sender ON video_requests(sender_user_id);
CREATE INDEX idx_video_requests_receiver ON video_requests(receiver_user_id);
CREATE INDEX idx_video_requests_status ON video_requests(status);
CREATE INDEX idx_video_requests_expires_at ON video_requests(expires_at);
