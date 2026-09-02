--
-- PostgreSQL database dump
--

\restrict WamwXofDw0cmUxcIjc6e8nfGqjcP9kKdrcNP1Rg5zelGgroTdQeAHzBPxhIzPhh

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_GameMoves_symbol; Type: TYPE; Schema: public; Owner: tiri
--

CREATE TYPE public."enum_GameMoves_symbol" AS ENUM (
    'X',
    'O'
);


ALTER TYPE public."enum_GameMoves_symbol" OWNER TO tiri;

--
-- Name: enum_Games_current_turn; Type: TYPE; Schema: public; Owner: tiri
--

CREATE TYPE public."enum_Games_current_turn" AS ENUM (
    'X',
    'O'
);


ALTER TYPE public."enum_Games_current_turn" OWNER TO tiri;

--
-- Name: enum_Games_status; Type: TYPE; Schema: public; Owner: tiri
--

CREATE TYPE public."enum_Games_status" AS ENUM (
    'pending',
    'ongoing',
    'finished'
);


ALTER TYPE public."enum_Games_status" OWNER TO tiri;

--
-- Name: enum_game_moves_symbol; Type: TYPE; Schema: public; Owner: tiri
--

CREATE TYPE public.enum_game_moves_symbol AS ENUM (
    'X',
    'O'
);


ALTER TYPE public.enum_game_moves_symbol OWNER TO tiri;

--
-- Name: enum_games_status; Type: TYPE; Schema: public; Owner: tiri
--

CREATE TYPE public.enum_games_status AS ENUM (
    'ongoing',
    'finished'
);


ALTER TYPE public.enum_games_status OWNER TO tiri;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: tiri
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO tiri;

--
-- Name: game_moves; Type: TABLE; Schema: public; Owner: tiri
--

CREATE TABLE public.game_moves (
    id integer NOT NULL,
    game_id integer NOT NULL,
    move_number integer NOT NULL,
    player_id integer NOT NULL,
    symbol character(1) NOT NULL,
    square integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.game_moves OWNER TO tiri;

--
-- Name: game_moves_id_seq; Type: SEQUENCE; Schema: public; Owner: tiri
--

CREATE SEQUENCE public.game_moves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_moves_id_seq OWNER TO tiri;

--
-- Name: game_moves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiri
--

ALTER SEQUENCE public.game_moves_id_seq OWNED BY public.game_moves.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: tiri
--

CREATE TABLE public.games (
    id integer NOT NULL,
    player_x_id integer NOT NULL,
    player_o_id integer,
    game_code character varying(10) NOT NULL,
    board json DEFAULT '{"cells":["","","","","","","","",""]}'::json NOT NULL,
    current_turn character(1) NOT NULL,
    status character varying(20) DEFAULT 'waiting'::character varying NOT NULL,
    winner character(1),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.games OWNER TO tiri;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: tiri
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.games_id_seq OWNER TO tiri;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiri
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: tiri
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO tiri;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: tiri
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO tiri;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiri
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: game_moves id; Type: DEFAULT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.game_moves ALTER COLUMN id SET DEFAULT nextval('public.game_moves_id_seq'::regclass);


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: game_moves game_moves_pkey; Type: CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.game_moves
    ADD CONSTRAINT game_moves_pkey PRIMARY KEY (id);


--
-- Name: games games_game_code_key; Type: CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_game_code_key UNIQUE (game_code);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: game_moves_game_id_move_number; Type: INDEX; Schema: public; Owner: tiri
--

CREATE UNIQUE INDEX game_moves_game_id_move_number ON public.game_moves USING btree (game_id, move_number);


--
-- Name: game_moves_game_id_square; Type: INDEX; Schema: public; Owner: tiri
--

CREATE UNIQUE INDEX game_moves_game_id_square ON public.game_moves USING btree (game_id, square);


--
-- Name: game_moves game_moves_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.game_moves
    ADD CONSTRAINT game_moves_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: game_moves game_moves_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.game_moves
    ADD CONSTRAINT game_moves_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: games games_player_o_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_player_o_id_fkey FOREIGN KEY (player_o_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: games games_player_x_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiri
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_player_x_id_fkey FOREIGN KEY (player_x_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO tiri;


--
-- PostgreSQL database dump complete
--

\unrestrict WamwXofDw0cmUxcIjc6e8nfGqjcP9kKdrcNP1Rg5zelGgroTdQeAHzBPxhIzPhh

