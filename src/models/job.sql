-- Table: public.jobs

-- DROP TABLE IF EXISTS public.jobs;

CREATE TABLE IF NOT EXISTS public.jobs
(
    id serial,
    created_at timestamp without time zone NOT NULL,
    title text NOT NULL,
    href text NOT NULL,
    domain text NOT NULL,
    grade text NOT NULL,
    institution text NOT NULL,
    location text NOT NULL,
    deadline text NOT NULL,
    position_type text NOT NULL,
    CONSTRAINT jobs_pkey PRIMARY KEY (id)
);