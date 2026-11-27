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
BEGIN
    SELECT style_id INTO v_style_hm FROM styles WHERE style_no = 'HM-TSHIRT-2026-A1';
    SELECT style_id INTO v_style_zr FROM styles WHERE style_no = 'ZR-DENIM-JACKET-09';
    SELECT style_id INTO v_style_ms FROM styles WHERE style_no = 'MS-POLO-CLASSIC-04';
    SELECT style_id INTO v_style_uq FROM styles WHERE style_no = 'UQ-AIRISM-TEE-11';

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
