-- Development seed only. Replace/import this table data from your chosen ODbL-compatible
-- country-state-city local dataset before production.
INSERT INTO countries(name, iso2) VALUES ('India', 'IN');
SET @india = LAST_INSERT_ID();

INSERT INTO states(country_id, name, state_code) VALUES (@india, 'Uttar Pradesh', 'UP');
SET @up = LAST_INSERT_ID();

INSERT INTO cities(state_id, name) VALUES
(@up, 'Agra'), (@up, 'Kanpur'), (@up, 'Lucknow'), (@up, 'Noida'),
(@up, 'Shahabad'), (@up, 'Varanasi');
