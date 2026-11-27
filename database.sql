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
INSERT INTO styles (buyer_name, style_no, smv, order_qty)
VALUES
    ('H&M Group', 'HM-TSHIRT-2026-A1', 8.50, 25000),
    ('Zara / Inditex', 'ZR-DENIM-JACKET-09', 24.00, 10000),
    ('Marks & Spencer', 'MS-POLO-CLASSIC-04', 12.25, 15000),
    ('Target USA', 'TG-CARGO-PANT-77', 18.75, 18000),
    ('Uniqlo', 'UQ-AIRISM-TEE-11', 7.80, 40000)
ON CONFLICT (style_no) DO NOTHING;

-- 2. Seed Vehicles (ON CONFLICT DO NOTHING on reg_no)
INSERT INTO vehicles (reg_no, vehicle_type, seat_capacity, status)
VALUES
    ('DHK-METRO-CHA-11-2041', 'Staff Bus', 35, 'Active'),
    ('DHK-METRO-GA-14-5582', 'Microbus (Toyota HiAce)', 14, 'Active'),
    ('DHK-METRO-BHA-21-9034', 'Covered Van (Logistics)', 3, 'Active'),
    ('DHK-METRO-CHA-12-8841', 'Staff Bus', 40, 'Under Maintenance'),
    ('DHK-METRO-KHA-33-1209', 'Executive Sedan (Toyota Premio)', 4, 'Active')
ON CONFLICT (reg_no) DO NOTHING;

-- 3. Seed Line Production Records
-- Query style IDs dynamically to maintain referential integrity safely
DO $$
DECLARE
    v_style_hm BIGINT;
    v_style_zr BIGINT;
    v_style_ms BIGINT;
    v_style_uq BIGINT;
    v_style_tg BIGINT;
BEGIN
    SELECT style_id INTO v_style_hm FROM styles WHERE style_no = 'HM-TSHIRT-2026-A1';
    SELECT style_id INTO v_style_zr FROM styles WHERE style_no = 'ZR-DENIM-JACKET-09';
    SELECT style_id INTO v_style_ms FROM styles WHERE style_no = 'MS-POLO-CLASSIC-04';
    SELECT style_id INTO v_style_uq FROM styles WHERE style_no = 'UQ-AIRISM-TEE-11';
    SELECT style_id INTO v_style_tg FROM styles WHERE style_no = 'TG-CARGO-PANT-77';

    -- Insert production only if style exists and record not already inserted
    IF v_style_hm IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM line_production WHERE prod_date = '2026-11-20' AND floor_no = 1 AND line_no = 1 AND style_id = v_style_hm
    ) THEN
        INSERT INTO line_production (prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty)
        VALUES ('2026-11-20', 1, 1, v_style_hm, 28, 480, 1150, 24);
    END IF;

    IF v_style_zr IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM line_production WHERE prod_date = '2026-11-20' AND floor_no = 2 AND line_no = 3 AND style_id = v_style_zr
    ) THEN
        INSERT INTO line_production (prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty)
        VALUES ('2026-11-20', 2, 3, v_style_zr, 32, 480, 420, 15);
    END IF;

    IF v_style_ms IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM line_production WHERE prod_date = '2026-11-21' AND floor_no = 1 AND line_no = 2 AND style_id = v_style_ms
    ) THEN
        INSERT INTO line_production (prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty)
        VALUES ('2026-11-21', 1, 2, v_style_ms, 25, 540, 890, 18);
    END IF;

    IF v_style_uq IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM line_production WHERE prod_date = '2026-11-21' AND floor_no = 3 AND line_no = 5 AND style_id = v_style_uq
    ) THEN
        INSERT INTO line_production (prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty)
        VALUES ('2026-11-21', 3, 5, v_style_uq, 30, 480, 1420, 19);
    END IF;

    -- Deliberately under-performing line so the dashboard demonstrates the
    -- "< 65% critical bottleneck" highlight out of the box.
    IF v_style_tg IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM line_production WHERE prod_date = '2026-11-21' AND floor_no = 4 AND line_no = 1 AND style_id = v_style_tg
    ) THEN
        INSERT INTO line_production (prod_date, floor_no, line_no, style_id, operators_present, working_minutes, output_qty, defect_qty)
        VALUES ('2026-11-21', 4, 1, v_style_tg, 32, 480, 300, 21);
    END IF;
END $$;

-- 4. Seed Trips
DO $$
DECLARE
    v_veh_bus BIGINT;
    v_veh_micro BIGINT;
    v_veh_sedan BIGINT;
BEGIN
    SELECT vehicle_id INTO v_veh_bus FROM vehicles WHERE reg_no = 'DHK-METRO-CHA-11-2041';
    SELECT vehicle_id INTO v_veh_micro FROM vehicles WHERE reg_no = 'DHK-METRO-GA-14-5582';
    SELECT vehicle_id INTO v_veh_sedan FROM vehicles WHERE reg_no = 'DHK-METRO-KHA-33-1209';

    IF v_veh_bus IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM trips WHERE vehicle_id = v_veh_bus AND route_name = 'Factory to Gazipur Staff Route 1'
    ) THEN
        INSERT INTO trips (vehicle_id, route_name, departure_time, estimated_return_time, passenger_count, status)
        VALUES (
            v_veh_bus,
            'Factory to Gazipur Staff Route 1',
            NOW() + INTERVAL '1 day',
            NOW() + INTERVAL '1 day 3 hours',
            32,
            'Scheduled'
        );
    END IF;

    IF v_veh_micro IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM trips WHERE vehicle_id = v_veh_micro AND route_name = 'Factory to Uttara Metro Station Shuttle'
    ) THEN
        INSERT INTO trips (vehicle_id, route_name, departure_time, estimated_return_time, passenger_count, status)
        VALUES (
            v_veh_micro,
            'Factory to Uttara Metro Station Shuttle',
            NOW() + INTERVAL '4 hours',
            NOW() + INTERVAL '6 hours',
            12,
            'Scheduled'
        );
    END IF;

    -- One currently-dispatched vehicle so Fleet Utilization is non-zero on a
    -- fresh install (1 of 4 active vehicles = 25%).
    IF v_veh_bus IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM trips WHERE vehicle_id = v_veh_bus AND route_name = 'Morning Shift Staff Pickup'
    ) THEN
        INSERT INTO trips (vehicle_id, route_name, departure_time, estimated_return_time, passenger_count, status)
        VALUES (
            v_veh_bus,
            'Morning Shift Staff Pickup',
            NOW() - INTERVAL '30 minutes',
            NOW() + INTERVAL '2 hours',
            28,
            'Dispatched'
        );
    END IF;

    IF v_veh_sedan IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM trips WHERE vehicle_id = v_veh_sedan AND route_name = 'Buyer Visit: Airport to Factory'
    ) THEN
        INSERT INTO trips (vehicle_id, route_name, departure_time, estimated_return_time, passenger_count, status)
        VALUES (
            v_veh_sedan,
            'Buyer Visit: Airport to Factory',
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day - 2 hours',
            3,
            'Completed'
        );
    END IF;
END $$;
