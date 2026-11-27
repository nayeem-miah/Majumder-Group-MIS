CREATE EXTENSION IF NOT EXISTS btree_gist;


-- 1. Table: admins
CREATE TABLE IF NOT EXISTS admins (
    admin_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);


-- 2. Table: styles
CREATE TABLE IF NOT EXISTS styles (
    style_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    buyer_name VARCHAR(150) NOT NULL,
    style_no VARCHAR(100) UNIQUE NOT NULL,
    smv DECIMAL(10,2) NOT NULL CHECK (smv > 0),
    order_qty INTEGER NOT NULL CHECK (order_qty > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_styles_style_no ON styles(style_no);
CREATE INDEX IF NOT EXISTS idx_styles_buyer_name ON styles(buyer_name);


-- 3. Table: line_production
CREATE TABLE IF NOT EXISTS line_production (
    prod_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    prod_date DATE NOT NULL,
    floor_no INTEGER NOT NULL,
    line_no INTEGER NOT NULL,
    style_id BIGINT NOT NULL REFERENCES styles(style_id) ON DELETE RESTRICT,
    operators_present INTEGER NOT NULL CHECK (operators_present > 0),
    working_minutes INTEGER NOT NULL CHECK (working_minutes > 0),
    output_qty INTEGER NOT NULL CHECK (output_qty >= 0),
    defect_qty INTEGER NOT NULL CHECK (defect_qty >= 0 AND defect_qty <= output_qty),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_production_date ON line_production(prod_date);
CREATE INDEX IF NOT EXISTS idx_line_production_style_id ON line_production(style_id);
CREATE INDEX IF NOT EXISTS idx_line_production_floor_line ON line_production(floor_no, line_no);


-- 4. Table: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    reg_no VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    seat_capacity INTEGER NOT NULL CHECK (seat_capacity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Under Maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_reg_no ON vehicles(reg_no);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);


-- 5. Table: trips
CREATE TABLE IF NOT EXISTS trips (
    trip_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
    route_name VARCHAR(200) NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    estimated_return_time TIMESTAMPTZ NOT NULL,
    passenger_count INTEGER NOT NULL CHECK (passenger_count > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Dispatched', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trip_time CHECK (departure_time < estimated_return_time)
);

CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON trips(departure_time);

-- Safe trigger function to auto-update updated_at timestamp across tables
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admins_updated_at') THEN
        CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_styles_updated_at') THEN
        CREATE TRIGGER trg_styles_updated_at BEFORE UPDATE ON styles FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_line_production_updated_at') THEN
        CREATE TRIGGER trg_line_production_updated_at BEFORE UPDATE ON line_production FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vehicles_updated_at') THEN
        CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_trips_updated_at') THEN
        CREATE TRIGGER trg_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
    END IF;
END $$;
