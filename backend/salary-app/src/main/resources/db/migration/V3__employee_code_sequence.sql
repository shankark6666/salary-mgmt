-- Employee codes (EMP-00001) come from a sequence so concurrent creates can never collide.
-- The seeder advances it past the seeded codes.
CREATE SEQUENCE employee_code_seq START WITH 1;
