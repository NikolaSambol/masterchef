-- Runs after Hibernate has created the tables for the integration tests.
-- It adds what Hibernate cannot generate from the entity classes but the application relies on.
-- (In production these were set up by hand; a Flyway migration would be the proper long-term fix.)

-- The two roles that sign-up and the security rules expect to exist.
INSERT INTO roles (role_name) VALUES ('ROLE_USER'), ('ROLE_ADMIN');

-- Recipe.creationDate is "insertable = false", so the database must fill it in.
ALTER TABLE recipes MODIFY creation_date DATE DEFAULT (CURRENT_DATE);
