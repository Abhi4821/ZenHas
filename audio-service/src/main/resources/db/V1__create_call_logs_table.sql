CREATE TABLE IF NOT EXISTS call_logs
(

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    room_id VARCHAR(100) NOT NULL UNIQUE,

    caller_id VARCHAR(50) NOT NULL,

    receiver_id VARCHAR(50) NOT NULL,

    caller_gender VARCHAR(20),

    receiver_gender VARCHAR(20),

    caller_country_id BIGINT,

    receiver_country_id BIGINT,

    caller_state_id BIGINT,

    receiver_state_id BIGINT,

    caller_rate_tier VARCHAR(10),

    receiver_rate_tier VARCHAR(10),

    status VARCHAR(30) NOT NULL,

    end_reason VARCHAR(50),

    started_at TIMESTAMP NOT NULL,

    connected_at TIMESTAMP NULL,

    ended_at TIMESTAMP NULL,

    duration_seconds BIGINT DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_call_logs_caller
        FOREIGN KEY (caller_id)
            REFERENCES users(user_id),

    CONSTRAINT fk_call_logs_receiver
        FOREIGN KEY (receiver_id)
            REFERENCES users(user_id),

    CONSTRAINT fk_call_logs_caller_country
        FOREIGN KEY (caller_country_id)
            REFERENCES countries(id),

    CONSTRAINT fk_call_logs_receiver_country
        FOREIGN KEY (receiver_country_id)
            REFERENCES countries(id),

    CONSTRAINT fk_call_logs_caller_state
        FOREIGN KEY (caller_state_id)
            REFERENCES states(id),

    CONSTRAINT fk_call_logs_receiver_state
        FOREIGN KEY (receiver_state_id)
            REFERENCES states(id)

);

CREATE INDEX idx_call_logs_room
    ON call_logs(room_id);

CREATE INDEX idx_call_logs_caller
    ON call_logs(caller_id);

CREATE INDEX idx_call_logs_receiver
    ON call_logs(receiver_id);

CREATE INDEX idx_call_logs_status
    ON call_logs(status);

CREATE INDEX idx_call_logs_started_at
    ON call_logs(started_at);

CREATE INDEX idx_call_logs_created_at
    ON call_logs(created_at);