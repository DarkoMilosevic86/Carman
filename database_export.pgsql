--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2
-- Dumped by pg_dump version 14.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    accountid integer NOT NULL,
    username character varying(200) DEFAULT ''::character varying NOT NULL,
    password character varying(200) DEFAULT ''::character varying NOT NULL,
    companyname character varying(200) DEFAULT ''::character varying NOT NULL,
    companylogo character varying(200) DEFAULT ''::character varying NOT NULL,
    phone character varying(200) DEFAULT ''::character varying NOT NULL,
    email character varying(200) DEFAULT ''::character varying NOT NULL,
    note character varying(200) DEFAULT ''::character varying NOT NULL,
    maxdevices character varying(200) DEFAULT ''::character varying NOT NULL,
    isactive boolean DEFAULT false,
    issms boolean,
    datebirth character varying(200),
    demodays integer,
    creationdate bigint,
    firstname character varying(50),
    lastname character varying(50),
    street character varying(255),
    number character varying(50),
    city character varying(255),
    place character varying(255),
    userid integer,
    role integer
);


ALTER TABLE public.account OWNER TO postgres;

--
-- Name: account_accountid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_accountid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_accountid_seq OWNER TO postgres;

--
-- Name: account_accountid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_accountid_seq OWNED BY public.account.accountid;


--
-- Name: auction; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.auction (
    id integer NOT NULL,
    creation_date integer DEFAULT 0 NOT NULL,
    expiration_date integer,
    start_date integer DEFAULT 0 NOT NULL,
    start_price double precision DEFAULT 0 NOT NULL,
    current_price double precision DEFAULT 0 NOT NULL,
    accountid integer DEFAULT 0 NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    vehicleid integer NOT NULL
);


ALTER TABLE public.auction OWNER TO admin;

--
-- Name: auction_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.auction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.auction_id_seq OWNER TO admin;

--
-- Name: auction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.auction_id_seq OWNED BY public.auction.id;


--
-- Name: automobile; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.automobile (
    id integer NOT NULL,
    vin character varying(200) DEFAULT ''::character varying NOT NULL,
    typecert character varying(200) DEFAULT ''::character varying NOT NULL,
    brand character varying(200) DEFAULT ''::character varying NOT NULL,
    model character varying(200) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.automobile OWNER TO admin;

--
-- Name: automobile_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.automobile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.automobile_id_seq OWNER TO admin;

--
-- Name: automobile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.automobile_id_seq OWNED BY public.automobile.id;


--
-- Name: bid; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.bid (
    id integer NOT NULL,
    creation_date integer DEFAULT 0 NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    auctionid integer DEFAULT 0 NOT NULL,
    accountid integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.bid OWNER TO admin;

--
-- Name: bid_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.bid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bid_id_seq OWNER TO admin;

--
-- Name: bid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.bid_id_seq OWNED BY public.bid.id;


--
-- Name: billed_sms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billed_sms (
    id integer NOT NULL,
    accountid integer NOT NULL,
    ammount integer NOT NULL,
    chargingdate bigint NOT NULL
);


ALTER TABLE public.billed_sms OWNER TO postgres;

--
-- Name: billed_sms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.billed_sms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.billed_sms_id_seq OWNER TO postgres;

--
-- Name: billed_sms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billed_sms_id_seq OWNED BY public.billed_sms.id;


--
-- Name: coll_brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_brands (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    brandid integer
);


ALTER TABLE public.coll_brands OWNER TO postgres;

--
-- Name: coll_brands_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_brands_id_seq OWNER TO postgres;

--
-- Name: coll_brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_brands_id_seq OWNED BY public.coll_brands.id;


--
-- Name: coll_colors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_colors (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.coll_colors OWNER TO postgres;

--
-- Name: coll_colors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_colors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_colors_id_seq OWNER TO postgres;

--
-- Name: coll_colors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_colors_id_seq OWNED BY public.coll_colors.id;


--
-- Name: coll_dimention; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_dimention (
    id integer NOT NULL,
    value1 integer,
    value2 integer,
    value3 integer,
    value4 integer,
    value5 integer,
    value6 integer,
    accountid integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.coll_dimention OWNER TO postgres;

--
-- Name: coll_dimention_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_dimention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_dimention_id_seq OWNER TO postgres;

--
-- Name: coll_dimention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_dimention_id_seq OWNED BY public.coll_dimention.id;


--
-- Name: coll_fuel_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_fuel_types (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.coll_fuel_types OWNER TO postgres;

--
-- Name: coll_fuel_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_fuel_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_fuel_types_id_seq OWNER TO postgres;

--
-- Name: coll_fuel_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_fuel_types_id_seq OWNED BY public.coll_fuel_types.id;


--
-- Name: coll_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_models (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    brandid integer
);


ALTER TABLE public.coll_models OWNER TO postgres;

--
-- Name: coll_models_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_models_id_seq OWNER TO postgres;

--
-- Name: coll_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_models_id_seq OWNED BY public.coll_models.id;


--
-- Name: coll_tire; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.coll_tire (
    id integer NOT NULL,
    front_tirebrandid integer,
    rear_tirebrandid integer,
    front_dimentionid integer,
    rear_dimentionid integer,
    rimid integer,
    profil_front character varying(200) DEFAULT ''::character varying,
    profil_rear character varying(200) DEFAULT ''::character varying
);


ALTER TABLE public.coll_tire OWNER TO admin;

--
-- Name: coll_tire_brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_tire_brands (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.coll_tire_brands OWNER TO postgres;

--
-- Name: coll_tire_brands_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_tire_brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_tire_brands_id_seq OWNER TO postgres;

--
-- Name: coll_tire_brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_tire_brands_id_seq OWNED BY public.coll_tire_brands.id;


--
-- Name: coll_tire_dimention; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.coll_tire_dimention (
    id integer NOT NULL,
    width numeric,
    height numeric,
    design character varying(200) DEFAULT ''::character varying,
    tire_size numeric,
    load_index numeric,
    speed_index character varying(200) DEFAULT ''::character varying,
    accountid integer NOT NULL
);


ALTER TABLE public.coll_tire_dimention OWNER TO admin;

--
-- Name: coll_tire_dimention_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.coll_tire_dimention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_tire_dimention_id_seq OWNER TO admin;

--
-- Name: coll_tire_dimention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.coll_tire_dimention_id_seq OWNED BY public.coll_tire_dimention.id;


--
-- Name: coll_tire_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.coll_tire_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_tire_id_seq OWNER TO admin;

--
-- Name: coll_tire_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.coll_tire_id_seq OWNED BY public.coll_tire.id;


--
-- Name: coll_tire_rim; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.coll_tire_rim (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.coll_tire_rim OWNER TO admin;

--
-- Name: coll_tire_rim_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.coll_tire_rim_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_tire_rim_id_seq OWNER TO admin;

--
-- Name: coll_tire_rim_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.coll_tire_rim_id_seq OWNED BY public.coll_tire_rim.id;


--
-- Name: coll_vehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_vehicle (
    id integer NOT NULL,
    brandid integer,
    modelid integer,
    fueltypeid integer,
    colorid integer,
    vin character varying(200) NOT NULL,
    type_certification character varying(200) DEFAULT ''::character varying,
    internal_number character varying(200) DEFAULT ''::character varying,
    market_date bigint,
    battery integer,
    service boolean DEFAULT false,
    mfk boolean DEFAULT false,
    mfk_price double precision,
    breaks_front boolean DEFAULT false,
    breaks_rear boolean DEFAULT false,
    engine_oil_leak boolean DEFAULT false,
    engine_oil_leak_price boolean DEFAULT false,
    trans_oil_leak boolean DEFAULT false,
    control_light boolean DEFAULT false,
    trans_type character varying(200) DEFAULT ''::character varying,
    drivable boolean DEFAULT false,
    axel_loader1 double precision DEFAULT 0,
    axel_loader2 double precision DEFAULT 0,
    note character varying(5000) DEFAULT ''::character varying,
    accountid integer DEFAULT 0 NOT NULL,
    millage double precision DEFAULT 0,
    small character varying(200) DEFAULT ''::character varying,
    small_price double precision DEFAULT 0,
    big character varying(200) DEFAULT ''::character varying,
    big_price double precision DEFAULT 0,
    price_breaks_front double precision DEFAULT 0,
    price_breaks_rear double precision DEFAULT 0,
    price_trans_oil_leak double precision DEFAULT 0,
    price_control_light double precision DEFAULT 0,
    interior character varying(200) DEFAULT ''::character varying,
    type character varying(200) DEFAULT 'new'::character varying NOT NULL,
    summer_tire_id integer,
    winter_tire_id integer,
    allseason_tire_id integer,
    tags character varying(500),
    service_price double precision
);


ALTER TABLE public.coll_vehicle OWNER TO postgres;

--
-- Name: coll_vehicle_cost; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.coll_vehicle_cost (
    id integer NOT NULL,
    vehicleid integer NOT NULL,
    accountid integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    price double precision
);


ALTER TABLE public.coll_vehicle_cost OWNER TO admin;

--
-- Name: coll_vehicle_cost_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.coll_vehicle_cost_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_vehicle_cost_id_seq OWNER TO admin;

--
-- Name: coll_vehicle_cost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.coll_vehicle_cost_id_seq OWNED BY public.coll_vehicle_cost.id;


--
-- Name: coll_vehicle_damage; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.coll_vehicle_damage (
    id integer NOT NULL,
    vehicleid integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    imageurl character varying(2000) DEFAULT ''::character varying NOT NULL,
    description character varying(5000) DEFAULT ''::character varying NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    accountid integer NOT NULL
);


ALTER TABLE public.coll_vehicle_damage OWNER TO admin;

--
-- Name: coll_vehicle_damage_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.coll_vehicle_damage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_vehicle_damage_id_seq OWNER TO admin;

--
-- Name: coll_vehicle_damage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.coll_vehicle_damage_id_seq OWNED BY public.coll_vehicle_damage.id;


--
-- Name: coll_vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_vehicle_id_seq OWNER TO postgres;

--
-- Name: coll_vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_vehicle_id_seq OWNED BY public.coll_vehicle.id;


--
-- Name: coll_vehicle_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coll_vehicle_photos (
    id integer NOT NULL,
    vehicleid integer,
    url character varying(2000) DEFAULT ''::character varying NOT NULL,
    accountid integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.coll_vehicle_photos OWNER TO postgres;

--
-- Name: coll_vehicle_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coll_vehicle_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coll_vehicle_photos_id_seq OWNER TO postgres;

--
-- Name: coll_vehicle_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coll_vehicle_photos_id_seq OWNED BY public.coll_vehicle_photos.id;


--
-- Name: contactperson; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contactperson (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    accountid integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.contactperson OWNER TO postgres;

--
-- Name: contactperson_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contactperson_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contactperson_id_seq OWNER TO postgres;

--
-- Name: contactperson_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contactperson_id_seq OWNED BY public.contactperson.id;


--
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    id integer NOT NULL,
    accountid integer NOT NULL,
    firstname character varying(200) DEFAULT ''::character varying NOT NULL,
    lastname character varying(200) DEFAULT ''::character varying NOT NULL,
    birthdate character varying(200) DEFAULT ''::character varying NOT NULL,
    imgurl character varying(200) DEFAULT ''::character varying NOT NULL,
    licensenumber character varying(200) DEFAULT ''::character varying NOT NULL,
    phone character varying(200) DEFAULT ''::character varying NOT NULL,
    receivesms boolean DEFAULT false NOT NULL,
    creationdate bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- Name: customer2smsgroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer2smsgroup (
    customerid integer NOT NULL,
    smsgroupid integer NOT NULL
);


ALTER TABLE public.customer2smsgroup OWNER TO postgres;

--
-- Name: customer2smstemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer2smstemplate (
    customerid integer NOT NULL,
    smstemplateid integer NOT NULL
);


ALTER TABLE public.customer2smstemplate OWNER TO postgres;

--
-- Name: customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_id_seq OWNER TO postgres;

--
-- Name: customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_id_seq OWNED BY public.customer.id;


--
-- Name: customer_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_images (
    id integer NOT NULL,
    customerid integer NOT NULL,
    url character varying(2000) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.customer_images OWNER TO postgres;

--
-- Name: customer_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_images_id_seq OWNER TO postgres;

--
-- Name: customer_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_images_id_seq OWNED BY public.customer_images.id;


--
-- Name: device; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device (
    deviceid character varying(500) NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    accountid integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.device OWNER TO postgres;

--
-- Name: drive; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drive (
    id integer NOT NULL,
    accountid integer NOT NULL,
    customerid integer NOT NULL,
    licenseplateid integer NOT NULL,
    vehicleid integer NOT NULL,
    handoverkm double precision DEFAULT 0 NOT NULL,
    handoverfuel double precision DEFAULT 0 NOT NULL,
    reteurnkm double precision DEFAULT 0 NOT NULL,
    returnfuel double precision DEFAULT 0 NOT NULL,
    rightsid integer NOT NULL,
    signatureurl character varying(2000) DEFAULT ''::character varying NOT NULL,
    status character varying(200) DEFAULT ''::character varying NOT NULL,
    handoverdate bigint DEFAULT 0,
    returndate bigint DEFAULT 0,
    note character varying(5000),
    documenturl character varying(2000) DEFAULT ''::character varying NOT NULL,
    type integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.drive OWNER TO postgres;

--
-- Name: drive_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drive_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.drive_id_seq OWNER TO postgres;

--
-- Name: drive_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drive_id_seq OWNED BY public.drive.id;


--
-- Name: employee; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.employee (
    id integer NOT NULL,
    username character varying(100) DEFAULT ''::character varying NOT NULL,
    firstname character varying(50),
    lastname character varying(50),
    password character varying(200),
    role integer,
    accountid integer NOT NULL
);


ALTER TABLE public.employee OWNER TO admin;

--
-- Name: employee_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employee_id_seq OWNER TO admin;

--
-- Name: employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.employee_id_seq OWNED BY public.employee.id;


--
-- Name: licenseplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.licenseplate (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    accountid integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.licenseplate OWNER TO postgres;

--
-- Name: licenseplate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.licenseplate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.licenseplate_id_seq OWNER TO postgres;

--
-- Name: licenseplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.licenseplate_id_seq OWNED BY public.licenseplate.id;


--
-- Name: rights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rights (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    accountid integer DEFAULT 0 NOT NULL,
    text character varying(2000) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.rights OWNER TO postgres;

--
-- Name: rights_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rights_id_seq OWNER TO postgres;

--
-- Name: rights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rights_id_seq OWNED BY public.rights.id;


--
-- Name: sms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms (
    id integer NOT NULL,
    message character varying(5000) DEFAULT ''::character varying NOT NULL,
    accountid integer NOT NULL,
    date bigint NOT NULL,
    charged boolean,
    twilioid character varying(2000) DEFAULT ''::character varying NOT NULL,
    customerid integer
);


ALTER TABLE public.sms OWNER TO postgres;

--
-- Name: sms_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_documents (
    id integer NOT NULL,
    smsid integer NOT NULL,
    docurl character varying(2000) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.sms_documents OWNER TO postgres;

--
-- Name: sms_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sms_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sms_documents_id_seq OWNER TO postgres;

--
-- Name: sms_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sms_documents_id_seq OWNED BY public.sms_documents.id;


--
-- Name: sms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sms_id_seq OWNER TO postgres;

--
-- Name: sms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sms_id_seq OWNED BY public.sms.id;


--
-- Name: smsgroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.smsgroup (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    imgurl character varying(2000) DEFAULT ''::character varying NOT NULL,
    accountid integer NOT NULL
);


ALTER TABLE public.smsgroup OWNER TO postgres;

--
-- Name: smsgroup_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.smsgroup_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.smsgroup_id_seq OWNER TO postgres;

--
-- Name: smsgroup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.smsgroup_id_seq OWNED BY public.smsgroup.id;


--
-- Name: smstemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.smstemplate (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    accountid integer NOT NULL,
    message character varying(5000) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.smstemplate OWNER TO postgres;

--
-- Name: smstemplate_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.smstemplate_documents (
    id integer NOT NULL,
    smstemplateid integer NOT NULL,
    docurl character varying(2000) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.smstemplate_documents OWNER TO postgres;

--
-- Name: smstemplate_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.smstemplate_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.smstemplate_documents_id_seq OWNER TO postgres;

--
-- Name: smstemplate_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.smstemplate_documents_id_seq OWNED BY public.smstemplate_documents.id;


--
-- Name: smstemplate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.smstemplate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.smstemplate_id_seq OWNER TO postgres;

--
-- Name: smstemplate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.smstemplate_id_seq OWNED BY public.smstemplate.id;


--
-- Name: superuser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.superuser (
    id integer NOT NULL,
    username character varying(200) NOT NULL,
    password character varying(200) NOT NULL,
    phone character varying(200) NOT NULL,
    resetlink character varying(2000)
);


ALTER TABLE public.superuser OWNER TO postgres;

--
-- Name: superuser_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.superuser_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.superuser_id_seq OWNER TO postgres;

--
-- Name: superuser_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.superuser_id_seq OWNED BY public.superuser.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(200) NOT NULL,
    password character varying(200) NOT NULL,
    firstname character varying(200) DEFAULT ''::character varying NOT NULL,
    lastname character varying(200) DEFAULT ''::character varying NOT NULL,
    role character varying(500)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    accountid integer DEFAULT 0 NOT NULL,
    code character varying(500),
    color character varying(200),
    miles integer,
    occupied boolean DEFAULT false
);


ALTER TABLE public.vehicle OWNER TO postgres;

--
-- Name: vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vehicle_id_seq OWNER TO postgres;

--
-- Name: vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicle_id_seq OWNED BY public.vehicle.id;


--
-- Name: account accountid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account ALTER COLUMN accountid SET DEFAULT nextval('public.account_accountid_seq'::regclass);


--
-- Name: auction id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.auction ALTER COLUMN id SET DEFAULT nextval('public.auction_id_seq'::regclass);


--
-- Name: automobile id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.automobile ALTER COLUMN id SET DEFAULT nextval('public.automobile_id_seq'::regclass);


--
-- Name: bid id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bid ALTER COLUMN id SET DEFAULT nextval('public.bid_id_seq'::regclass);


--
-- Name: billed_sms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billed_sms ALTER COLUMN id SET DEFAULT nextval('public.billed_sms_id_seq'::regclass);


--
-- Name: coll_brands id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_brands ALTER COLUMN id SET DEFAULT nextval('public.coll_brands_id_seq'::regclass);


--
-- Name: coll_colors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_colors ALTER COLUMN id SET DEFAULT nextval('public.coll_colors_id_seq'::regclass);


--
-- Name: coll_dimention id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_dimention ALTER COLUMN id SET DEFAULT nextval('public.coll_dimention_id_seq'::regclass);


--
-- Name: coll_fuel_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_fuel_types ALTER COLUMN id SET DEFAULT nextval('public.coll_fuel_types_id_seq'::regclass);


--
-- Name: coll_models id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_models ALTER COLUMN id SET DEFAULT nextval('public.coll_models_id_seq'::regclass);


--
-- Name: coll_tire id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire ALTER COLUMN id SET DEFAULT nextval('public.coll_tire_id_seq'::regclass);


--
-- Name: coll_tire_brands id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_tire_brands ALTER COLUMN id SET DEFAULT nextval('public.coll_tire_brands_id_seq'::regclass);


--
-- Name: coll_tire_dimention id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire_dimention ALTER COLUMN id SET DEFAULT nextval('public.coll_tire_dimention_id_seq'::regclass);


--
-- Name: coll_tire_rim id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire_rim ALTER COLUMN id SET DEFAULT nextval('public.coll_tire_rim_id_seq'::regclass);


--
-- Name: coll_vehicle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle ALTER COLUMN id SET DEFAULT nextval('public.coll_vehicle_id_seq'::regclass);


--
-- Name: coll_vehicle_cost id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_cost ALTER COLUMN id SET DEFAULT nextval('public.coll_vehicle_cost_id_seq'::regclass);


--
-- Name: coll_vehicle_damage id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_damage ALTER COLUMN id SET DEFAULT nextval('public.coll_vehicle_damage_id_seq'::regclass);


--
-- Name: coll_vehicle_photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle_photos ALTER COLUMN id SET DEFAULT nextval('public.coll_vehicle_photos_id_seq'::regclass);


--
-- Name: contactperson id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contactperson ALTER COLUMN id SET DEFAULT nextval('public.contactperson_id_seq'::regclass);


--
-- Name: customer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer ALTER COLUMN id SET DEFAULT nextval('public.customer_id_seq'::regclass);


--
-- Name: customer_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_images ALTER COLUMN id SET DEFAULT nextval('public.customer_images_id_seq'::regclass);


--
-- Name: drive id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drive ALTER COLUMN id SET DEFAULT nextval('public.drive_id_seq'::regclass);


--
-- Name: employee id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee ALTER COLUMN id SET DEFAULT nextval('public.employee_id_seq'::regclass);


--
-- Name: licenseplate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenseplate ALTER COLUMN id SET DEFAULT nextval('public.licenseplate_id_seq'::regclass);


--
-- Name: rights id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rights ALTER COLUMN id SET DEFAULT nextval('public.rights_id_seq'::regclass);


--
-- Name: sms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms ALTER COLUMN id SET DEFAULT nextval('public.sms_id_seq'::regclass);


--
-- Name: sms_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_documents ALTER COLUMN id SET DEFAULT nextval('public.sms_documents_id_seq'::regclass);


--
-- Name: smsgroup id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smsgroup ALTER COLUMN id SET DEFAULT nextval('public.smsgroup_id_seq'::regclass);


--
-- Name: smstemplate id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smstemplate ALTER COLUMN id SET DEFAULT nextval('public.smstemplate_id_seq'::regclass);


--
-- Name: smstemplate_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smstemplate_documents ALTER COLUMN id SET DEFAULT nextval('public.smstemplate_documents_id_seq'::regclass);


--
-- Name: superuser id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.superuser ALTER COLUMN id SET DEFAULT nextval('public.superuser_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle ALTER COLUMN id SET DEFAULT nextval('public.vehicle_id_seq'::regclass);


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account (accountid, username, password, companyname, companylogo, phone, email, note, maxdevices, isactive, issms, datebirth, demodays, creationdate, firstname, lastname, street, number, city, place, userid, role) FROM stdin;
\.


--
-- Data for Name: auction; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.auction (id, creation_date, expiration_date, start_date, start_price, current_price, accountid, status, vehicleid) FROM stdin;
\.


--
-- Data for Name: automobile; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.automobile (id, vin, typecert, brand, model) FROM stdin;
\.


--
-- Data for Name: bid; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.bid (id, creation_date, price, auctionid, accountid) FROM stdin;
\.


--
-- Data for Name: billed_sms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billed_sms (id, accountid, ammount, chargingdate) FROM stdin;
\.


--
-- Data for Name: coll_brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_brands (id, name, brandid) FROM stdin;
17	Renault	\N
18	Pegiot	\N
19	Audi	\N
20	Abarth	\N
21	Acura	\N
22	Alfa Romeo	\N
23	Aston Martin	\N
24	Audi	\N
25	Bentley	\N
26	BMW	\N
27	Buick	\N
28	Cadillac	\N
29	Chevrolet	\N
30	Chrysler	\N
31	Citroen	\N
32	Dacia	\N
33	Dodge	\N
34	Ferrari	\N
35	Fiat	\N
36	Ford	\N
37	GMC	\N
38	Honda	\N
39	Hummer	\N
40	Hyundai	\N
41	Infiniti	\N
42	Isuzu	\N
43	Jaguar	\N
44	Jeep	\N
45	Kia	\N
46	Lamborghini	\N
47	Lancia	\N
48	Land Rover	\N
49	Lexus	\N
50	Lincoln	\N
51	Lotus	\N
52	Maserati	\N
53	Mazda	\N
54	Mercedes-Benz	\N
55	Mercury	\N
56	Mini	\N
57	Mitsubishi	\N
58	Nissan	\N
59	Opel	\N
60	Peugeot	\N
61	Pontiac	\N
62	Porsche	\N
63	Ram	\N
64	Renault	\N
65	Saab	\N
66	Saturn	\N
67	Scion	\N
68	Seat	\N
69	Skoda	\N
70	Smart	\N
71	SsangYong	\N
72	Subaru	\N
73	Suzuki	\N
74	Tesla	\N
75	Toyota	\N
76	Volkswagen	\N
77	Volvo	\N
78	Wiesmann	\N
79	Abarth	\N
80	Acura	\N
81	Alfa Romeo	\N
82	Aston Martin	\N
83	Audi	\N
84	Bentley	\N
85	BMW	\N
86	Buick	\N
87	Cadillac	\N
88	Chevrolet	\N
89	Chrysler	\N
90	Citroen	\N
91	Dacia	\N
92	Dodge	\N
93	Ferrari	\N
94	Fiat	\N
95	Ford	\N
96	GMC	\N
97	Honda	\N
98	Hummer	\N
99	Hyundai	\N
100	Infiniti	\N
101	Isuzu	\N
102	Jaguar	\N
103	Jeep	\N
104	Kia	\N
105	Lamborghini	\N
106	Lancia	\N
107	Land Rover	\N
108	Lexus	\N
109	Lincoln	\N
110	Lotus	\N
111	Maserati	\N
112	Mazda	\N
113	Mercedes-Benz	\N
114	Mercury	\N
115	Mini	\N
116	Mitsubishi	\N
117	Nissan	\N
118	Opel	\N
119	Peugeot	\N
120	Pontiac	\N
121	Porsche	\N
122	Ram	\N
123	Renault	\N
124	Saab	\N
125	Saturn	\N
126	Scion	\N
127	Seat	\N
128	Skoda	\N
129	Smart	\N
130	SsangYong	\N
131	Subaru	\N
132	Suzuki	\N
133	Tesla	\N
134	Toyota	\N
135	Volkswagen	\N
136	Volvo	\N
137	Wiesmann	\N
\.


--
-- Data for Name: coll_colors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_colors (id, name) FROM stdin;
3	Grey
4	Black
5	Red
\.


--
-- Data for Name: coll_dimention; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_dimention (id, value1, value2, value3, value4, value5, value6, accountid) FROM stdin;
\.


--
-- Data for Name: coll_fuel_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_fuel_types (id, name) FROM stdin;
3	Petrol
4	Diesel
5	Hybrid
6	Hydrogen
7	Other
\.


--
-- Data for Name: coll_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_models (id, name, brandid) FROM stdin;
8	Megan	17
9	Laguna	17
10	Clio	17
11	406	17
12	406	18
13	307	18
14	206	18
15	A4	19
16	A6	19
17	80	19
18	Megane	64
19	A4	23
20	A5	23
21	Q5	23
22	Q7	23
23	Megane\n	20
24	Klio\n	20
25	Laguna\n	20
26	Renault 4\n	20
27	Renault 5	20
\.


--
-- Data for Name: coll_tire; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.coll_tire (id, front_tirebrandid, rear_tirebrandid, front_dimentionid, rear_dimentionid, rimid, profil_front, profil_rear) FROM stdin;
\.


--
-- Data for Name: coll_tire_brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_tire_brands (id, name) FROM stdin;
5	Bridgestone
6	Continental
7	Dunlop
8	Goodyear
9	Michelin
10	Pirelli
11	Avon
12	Barum
13	BFGoodrich
14	Cooper
15	Falken
16	Firestone
17	Fulda
18	Hankook
19	Kleber
20	Kumho
21	Nokian
22	Sava
23	Semperit
24	Toyo
25	Uniroyal
26	Vredestein
27	Yokohama
28	Aeolus
29	Accelera
30	Apollo
31	Atlas
32	Dayton
33	Debica
34	Delint
35	Doublestar
36	Evergreen
37	Federal
38	Fortuna
39	General
40	Gislaved
41	Goodride
42	Gripmax
43	GT Radial
44	Haida
45	Hifly
46	Imperial
47	Infinity
48	Interstate
49	Kormoran
50	Lassa
51	Laufen
52	Linglong
53	Marangoni
54	Mastersteel
55	Matador
56	Maxxis
57	Meteor
58	Milestone
59	Mirage
60	Momo
61	Nankang
62	Nexen
63	Nordex
64	Novex
65	Ovation
66	Paxaro
67	Pneumant
68	PowerTrac
69	Roadstone
70	Rockstone
71	Rotex
72	Sailun
73	Seiberling
74	Sonar
75	Sportiva
76	Premiorri
77	Starmax
78	Starfire
79	Sunitrac
80	Syron
81	Taurus
82	Tigar
83	Toledo
84	Tomason
85	Torque
86	Tyfoon
87	Wanly
88	Windforce
89	Zeta
\.


--
-- Data for Name: coll_tire_dimention; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.coll_tire_dimention (id, width, height, design, tire_size, load_index, speed_index, accountid) FROM stdin;
\.


--
-- Data for Name: coll_tire_rim; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.coll_tire_rim (id, name) FROM stdin;
1	SSR
2	RAYS VOLK
3	Niche Weels
4	American Legend
\.


--
-- Data for Name: coll_vehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_vehicle (id, brandid, modelid, fueltypeid, colorid, vin, type_certification, internal_number, market_date, battery, service, mfk, mfk_price, breaks_front, breaks_rear, engine_oil_leak, engine_oil_leak_price, trans_oil_leak, control_light, trans_type, drivable, axel_loader1, axel_loader2, note, accountid, millage, small, small_price, big, big_price, price_breaks_front, price_breaks_rear, price_trans_oil_leak, price_control_light, interior, type, summer_tire_id, winter_tire_id, allseason_tire_id, tags, service_price) FROM stdin;
\.


--
-- Data for Name: coll_vehicle_cost; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.coll_vehicle_cost (id, vehicleid, accountid, name, price) FROM stdin;
\.


--
-- Data for Name: coll_vehicle_damage; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.coll_vehicle_damage (id, vehicleid, name, imageurl, description, price, accountid) FROM stdin;
\.


--
-- Data for Name: coll_vehicle_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coll_vehicle_photos (id, vehicleid, url, accountid) FROM stdin;
\.


--
-- Data for Name: contactperson; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contactperson (id, name, accountid) FROM stdin;
\.


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer (id, accountid, firstname, lastname, birthdate, imgurl, licensenumber, phone, receivesms, creationdate) FROM stdin;
\.


--
-- Data for Name: customer2smsgroup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer2smsgroup (customerid, smsgroupid) FROM stdin;
\.


--
-- Data for Name: customer2smstemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer2smstemplate (customerid, smstemplateid) FROM stdin;
\.


--
-- Data for Name: customer_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_images (id, customerid, url) FROM stdin;
\.


--
-- Data for Name: device; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.device (deviceid, name, accountid) FROM stdin;
\.


--
-- Data for Name: drive; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drive (id, accountid, customerid, licenseplateid, vehicleid, handoverkm, handoverfuel, reteurnkm, returnfuel, rightsid, signatureurl, status, handoverdate, returndate, note, documenturl, type) FROM stdin;
\.


--
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.employee (id, username, firstname, lastname, password, role, accountid) FROM stdin;
\.


--
-- Data for Name: licenseplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.licenseplate (id, name, accountid) FROM stdin;
\.


--
-- Data for Name: rights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rights (id, name, accountid, text) FROM stdin;
\.


--
-- Data for Name: sms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms (id, message, accountid, date, charged, twilioid, customerid) FROM stdin;
\.


--
-- Data for Name: sms_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms_documents (id, smsid, docurl) FROM stdin;
\.


--
-- Data for Name: smsgroup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smsgroup (id, name, imgurl, accountid) FROM stdin;
\.


--
-- Data for Name: smstemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smstemplate (id, name, accountid, message) FROM stdin;
\.


--
-- Data for Name: smstemplate_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smstemplate_documents (id, smstemplateid, docurl) FROM stdin;
\.


--
-- Data for Name: superuser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.superuser (id, username, password, phone, resetlink) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, firstname, lastname, role) FROM stdin;
\.


--
-- Data for Name: vehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle (id, name, accountid, code, color, miles, occupied) FROM stdin;
\.


--
-- Name: account_accountid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.account_accountid_seq', 119, true);


--
-- Name: auction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.auction_id_seq', 18, true);


--
-- Name: automobile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.automobile_id_seq', 1, false);


--
-- Name: bid_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.bid_id_seq', 45, true);


--
-- Name: billed_sms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billed_sms_id_seq', 29, true);


--
-- Name: coll_brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_brands_id_seq', 137, true);


--
-- Name: coll_colors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_colors_id_seq', 5, true);


--
-- Name: coll_dimention_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_dimention_id_seq', 1, true);


--
-- Name: coll_fuel_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_fuel_types_id_seq', 7, true);


--
-- Name: coll_models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_models_id_seq', 27, true);


--
-- Name: coll_tire_brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_tire_brands_id_seq', 89, true);


--
-- Name: coll_tire_dimention_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.coll_tire_dimention_id_seq', 93, true);


--
-- Name: coll_tire_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.coll_tire_id_seq', 52, true);


--
-- Name: coll_tire_rim_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.coll_tire_rim_id_seq', 4, true);


--
-- Name: coll_vehicle_cost_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.coll_vehicle_cost_id_seq', 24, true);


--
-- Name: coll_vehicle_damage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.coll_vehicle_damage_id_seq', 38, true);


--
-- Name: coll_vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_vehicle_id_seq', 51, true);


--
-- Name: coll_vehicle_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coll_vehicle_photos_id_seq', 41, true);


--
-- Name: contactperson_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contactperson_id_seq', 108, true);


--
-- Name: customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_id_seq', 100, true);


--
-- Name: customer_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_images_id_seq', 41, true);


--
-- Name: drive_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drive_id_seq', 107, true);


--
-- Name: employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.employee_id_seq', 1, false);


--
-- Name: licenseplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.licenseplate_id_seq', 35, true);


--
-- Name: rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rights_id_seq', 22, true);


--
-- Name: sms_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sms_documents_id_seq', 20, true);


--
-- Name: sms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sms_id_seq', 89, true);


--
-- Name: smsgroup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.smsgroup_id_seq', 2, true);


--
-- Name: smstemplate_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.smstemplate_documents_id_seq', 9, true);


--
-- Name: smstemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.smstemplate_id_seq', 16, true);


--
-- Name: superuser_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.superuser_id_seq', 11, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 43, true);


--
-- Name: vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_id_seq', 29, true);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (accountid);


--
-- Name: auction auction_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.auction
    ADD CONSTRAINT auction_pkey PRIMARY KEY (id);


--
-- Name: automobile automobile_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.automobile
    ADD CONSTRAINT automobile_pkey PRIMARY KEY (id);


--
-- Name: bid bid_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bid
    ADD CONSTRAINT bid_pkey PRIMARY KEY (id);


--
-- Name: billed_sms billedsms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billed_sms
    ADD CONSTRAINT billedsms_pkey PRIMARY KEY (id);


--
-- Name: coll_brands coll_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_brands
    ADD CONSTRAINT coll_brands_pkey PRIMARY KEY (id);


--
-- Name: coll_colors coll_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_colors
    ADD CONSTRAINT coll_colors_pkey PRIMARY KEY (id);


--
-- Name: coll_dimention coll_dimention_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_dimention
    ADD CONSTRAINT coll_dimention_pkey PRIMARY KEY (id);


--
-- Name: coll_fuel_types coll_fuel_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_fuel_types
    ADD CONSTRAINT coll_fuel_types_pkey PRIMARY KEY (id);


--
-- Name: coll_models coll_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_models
    ADD CONSTRAINT coll_models_pkey PRIMARY KEY (id);


--
-- Name: coll_tire_brands coll_tire_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_tire_brands
    ADD CONSTRAINT coll_tire_brands_pkey PRIMARY KEY (id);


--
-- Name: coll_tire_dimention coll_tire_dimention_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire_dimention
    ADD CONSTRAINT coll_tire_dimention_pkey PRIMARY KEY (id);


--
-- Name: coll_tire coll_tire_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire
    ADD CONSTRAINT coll_tire_pkey PRIMARY KEY (id);


--
-- Name: coll_tire_rim coll_tire_rim_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire_rim
    ADD CONSTRAINT coll_tire_rim_pkey PRIMARY KEY (id);


--
-- Name: coll_vehicle_cost coll_vehicle_cost_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_cost
    ADD CONSTRAINT coll_vehicle_cost_pkey PRIMARY KEY (id);


--
-- Name: coll_vehicle_damage coll_vehicle_damage_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_damage
    ADD CONSTRAINT coll_vehicle_damage_pkey PRIMARY KEY (id);


--
-- Name: coll_vehicle_photos coll_vehicle_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle_photos
    ADD CONSTRAINT coll_vehicle_photos_pkey PRIMARY KEY (id);


--
-- Name: coll_vehicle coll_vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT coll_vehicle_pkey PRIMARY KEY (id);


--
-- Name: coll_vehicle coll_vehicle_vin_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT coll_vehicle_vin_key UNIQUE (vin);


--
-- Name: contactperson contactperson_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contactperson
    ADD CONSTRAINT contactperson_pkey PRIMARY KEY (id);


--
-- Name: customer2smstemplate costumer_smstempalte_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer2smstemplate
    ADD CONSTRAINT costumer_smstempalte_pkey PRIMARY KEY (customerid, smstemplateid);


--
-- Name: customer2smsgroup customer2smsgroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer2smsgroup
    ADD CONSTRAINT customer2smsgroup_pkey PRIMARY KEY (customerid, smsgroupid);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: customer_images customerimages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_images
    ADD CONSTRAINT customerimages_pkey PRIMARY KEY (id);


--
-- Name: device device_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT device_pkey PRIMARY KEY (deviceid);


--
-- Name: drive drive_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drive
    ADD CONSTRAINT drive_pkey PRIMARY KEY (id);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (id);


--
-- Name: employee employee_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_username_key UNIQUE (username);


--
-- Name: licenseplate licenseplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenseplate
    ADD CONSTRAINT licenseplate_pkey PRIMARY KEY (id);


--
-- Name: rights rights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_pkey PRIMARY KEY (id);


--
-- Name: sms_documents sms_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_documents
    ADD CONSTRAINT sms_documents_pkey PRIMARY KEY (id);


--
-- Name: sms sms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms
    ADD CONSTRAINT sms_pkey PRIMARY KEY (id);


--
-- Name: smsgroup smsgroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smsgroup
    ADD CONSTRAINT smsgroup_pkey PRIMARY KEY (id);


--
-- Name: smstemplate_documents smstemplate_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smstemplate_documents
    ADD CONSTRAINT smstemplate_documents_pkey PRIMARY KEY (id);


--
-- Name: smstemplate smstemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smstemplate
    ADD CONSTRAINT smstemplate_pkey PRIMARY KEY (id);


--
-- Name: superuser superuser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.superuser
    ADD CONSTRAINT superuser_pkey PRIMARY KEY (id);


--
-- Name: users user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (id);


--
-- Name: customer2smsgroup customer2smsgroup_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer2smsgroup
    ADD CONSTRAINT customer2smsgroup_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customer(id);


--
-- Name: customer2smsgroup customer2smsgroup_smsgroupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer2smsgroup
    ADD CONSTRAINT customer2smsgroup_smsgroupid_fkey FOREIGN KEY (smsgroupid) REFERENCES public.smsgroup(id);


--
-- Name: customer2smstemplate customer2smstemplate_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer2smstemplate
    ADD CONSTRAINT customer2smstemplate_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customer(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer2smstemplate customer2smstemplate_smstemplateid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer2smstemplate
    ADD CONSTRAINT customer2smstemplate_smstemplateid_fkey FOREIGN KEY (smstemplateid) REFERENCES public.smstemplate(id) ON UPDATE CASCADE;


--
-- Name: customer_images customerimages_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_images
    ADD CONSTRAINT customerimages_customerid_fkey FOREIGN KEY (customerid) REFERENCES public.customer(id);


--
-- Name: auction fk_auction_account; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.auction
    ADD CONSTRAINT fk_auction_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: bid fk_auction_account; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bid
    ADD CONSTRAINT fk_auction_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: bid fk_auction_auction; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bid
    ADD CONSTRAINT fk_auction_auction FOREIGN KEY (auctionid) REFERENCES public.auction(id);


--
-- Name: auction fk_auction_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.auction
    ADD CONSTRAINT fk_auction_vehicle FOREIGN KEY (vehicleid) REFERENCES public.coll_vehicle(id);


--
-- Name: coll_dimention fk_coll_dimention_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_dimention
    ADD CONSTRAINT fk_coll_dimention_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: coll_models fk_coll_models_brand; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_models
    ADD CONSTRAINT fk_coll_models_brand FOREIGN KEY (brandid) REFERENCES public.coll_brands(id);


--
-- Name: coll_tire_dimention fk_coll_tire_dimention_account; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire_dimention
    ADD CONSTRAINT fk_coll_tire_dimention_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: coll_tire fk_coll_tire_front_dimention; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire
    ADD CONSTRAINT fk_coll_tire_front_dimention FOREIGN KEY (front_dimentionid) REFERENCES public.coll_tire_dimention(id);


--
-- Name: coll_tire fk_coll_tire_front_tirebrand; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire
    ADD CONSTRAINT fk_coll_tire_front_tirebrand FOREIGN KEY (front_tirebrandid) REFERENCES public.coll_tire_brands(id);


--
-- Name: coll_tire fk_coll_tire_rear_dimention; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire
    ADD CONSTRAINT fk_coll_tire_rear_dimention FOREIGN KEY (rear_dimentionid) REFERENCES public.coll_tire_dimention(id);


--
-- Name: coll_tire fk_coll_tire_rear_tirebrand; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire
    ADD CONSTRAINT fk_coll_tire_rear_tirebrand FOREIGN KEY (rear_tirebrandid) REFERENCES public.coll_tire_brands(id);


--
-- Name: coll_tire fk_coll_tire_rim; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_tire
    ADD CONSTRAINT fk_coll_tire_rim FOREIGN KEY (rimid) REFERENCES public.coll_tire_rim(id);


--
-- Name: coll_vehicle fk_coll_vehicle_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: coll_vehicle fk_coll_vehicle_allseason_tire; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_allseason_tire FOREIGN KEY (allseason_tire_id) REFERENCES public.coll_tire(id);


--
-- Name: coll_vehicle fk_coll_vehicle_allseason_tire2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_allseason_tire2 FOREIGN KEY (allseason_tire_id) REFERENCES public.coll_tire(id);


--
-- Name: coll_vehicle fk_coll_vehicle_brand; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_brand FOREIGN KEY (brandid) REFERENCES public.coll_brands(id);


--
-- Name: coll_vehicle_cost fk_coll_vehicle_cost_account; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_cost
    ADD CONSTRAINT fk_coll_vehicle_cost_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: coll_vehicle_cost fk_coll_vehicle_cost_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_cost
    ADD CONSTRAINT fk_coll_vehicle_cost_vehicle FOREIGN KEY (vehicleid) REFERENCES public.coll_vehicle(id);


--
-- Name: coll_vehicle_damage fk_coll_vehicle_damage_account; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_damage
    ADD CONSTRAINT fk_coll_vehicle_damage_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: coll_vehicle_damage fk_coll_vehicle_damage_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coll_vehicle_damage
    ADD CONSTRAINT fk_coll_vehicle_damage_vehicle FOREIGN KEY (vehicleid) REFERENCES public.coll_vehicle(id);


--
-- Name: coll_vehicle fk_coll_vehicle_fuel_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_fuel_type FOREIGN KEY (fueltypeid) REFERENCES public.coll_fuel_types(id);


--
-- Name: coll_vehicle_photos fk_coll_vehicle_photos_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle_photos
    ADD CONSTRAINT fk_coll_vehicle_photos_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: coll_vehicle_photos fk_coll_vehicle_photos_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle_photos
    ADD CONSTRAINT fk_coll_vehicle_photos_vehicle FOREIGN KEY (vehicleid) REFERENCES public.coll_vehicle(id);


--
-- Name: coll_vehicle fk_coll_vehicle_summer_tire; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_summer_tire FOREIGN KEY (summer_tire_id) REFERENCES public.coll_tire(id);


--
-- Name: coll_vehicle fk_coll_vehicle_winter_color; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_winter_color FOREIGN KEY (colorid) REFERENCES public.coll_colors(id);


--
-- Name: coll_vehicle fk_coll_vehicle_winter_tire; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coll_vehicle
    ADD CONSTRAINT fk_coll_vehicle_winter_tire FOREIGN KEY (winter_tire_id) REFERENCES public.coll_tire(id);


--
-- Name: contactperson fk_cp_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contactperson
    ADD CONSTRAINT fk_cp_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: customer fk_customer_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT fk_customer_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: device fk_device_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device
    ADD CONSTRAINT fk_device_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: drive fk_drive_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drive
    ADD CONSTRAINT fk_drive_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: drive fk_drive_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drive
    ADD CONSTRAINT fk_drive_customer FOREIGN KEY (customerid) REFERENCES public.customer(id);


--
-- Name: drive fk_drive_lpate; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drive
    ADD CONSTRAINT fk_drive_lpate FOREIGN KEY (licenseplateid) REFERENCES public.licenseplate(id);


--
-- Name: drive fk_drive_rights; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drive
    ADD CONSTRAINT fk_drive_rights FOREIGN KEY (rightsid) REFERENCES public.rights(id);


--
-- Name: drive fk_drive_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drive
    ADD CONSTRAINT fk_drive_vehicle FOREIGN KEY (vehicleid) REFERENCES public.vehicle(id);


--
-- Name: employee fk_employee_account; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT fk_employee_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: licenseplate fk_lp_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.licenseplate
    ADD CONSTRAINT fk_lp_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: rights fk_rights_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT fk_rights_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: sms fk_sms_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms
    ADD CONSTRAINT fk_sms_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: billed_sms fk_sms_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billed_sms
    ADD CONSTRAINT fk_sms_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: sms fk_sms_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms
    ADD CONSTRAINT fk_sms_customer FOREIGN KEY (customerid) REFERENCES public.customer(id);


--
-- Name: smstemplate fk_st_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smstemplate
    ADD CONSTRAINT fk_st_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: smsgroup fk_st_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smsgroup
    ADD CONSTRAINT fk_st_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: vehicle fk_vehicle_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT fk_vehicle_account FOREIGN KEY (accountid) REFERENCES public.account(accountid);


--
-- Name: sms_documents sms_documents_smsid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_documents
    ADD CONSTRAINT sms_documents_smsid_fkey FOREIGN KEY (smsid) REFERENCES public.sms(id);


--
-- Name: smstemplate_documents smstemp_documents_templateid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smstemplate_documents
    ADD CONSTRAINT smstemp_documents_templateid_fkey FOREIGN KEY (smstemplateid) REFERENCES public.smstemplate(id);


--
-- PostgreSQL database dump complete
--

