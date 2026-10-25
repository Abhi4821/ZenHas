CREATE TABLE countries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    iso2 VARCHAR(2) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_countries_name (name),
    UNIQUE KEY uk_countries_iso2 (iso2)
);

CREATE TABLE states (
    id BIGINT NOT NULL AUTO_INCREMENT,
    country_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    state_code VARCHAR(20),
    PRIMARY KEY (id),
    UNIQUE KEY uk_states_country_name (country_id, name),
    CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE cities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    state_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cities_state_name (state_id, name),
    CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id)
);
