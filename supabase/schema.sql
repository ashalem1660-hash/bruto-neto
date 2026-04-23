-- =============================
-- ברוטו לנטו — Supabase Schema
-- =============================

CREATE TABLE IF NOT EXISTS tax_parameters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2025,
  income_tax_brackets JSONB NOT NULL DEFAULT '[]',
  credit_point_value_monthly NUMERIC(10,2) NOT NULL DEFAULT 242,
  bituach_leumi_employee_low_threshold NUMERIC(10,2) NOT NULL DEFAULT 7522,
  bituach_leumi_employee_low_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0555,
  bituach_leumi_employee_high_rate NUMERIC(5,4) NOT NULL DEFAULT 0.12,
  bituach_leumi_max_income NUMERIC(10,2) NOT NULL DEFAULT 50695,
  -- ביטוח לאומי מעסיק
  bl_employer_low_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0355,
  bl_employer_high_rate NUMERIC(5,4) NOT NULL DEFAULT 0.076,
  bl_employer_threshold NUMERIC(10,2) NOT NULL DEFAULT 7703,
  -- ביטוח לאומי עצמאי
  bituach_leumi_self_low_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0647,
  bituach_leumi_self_high_rate NUMERIC(5,4) NOT NULL DEFAULT 0.18,
  bituach_briut_low_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0323,
  bituach_briut_high_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0517,
  bituach_briut_threshold NUMERIC(10,2) NOT NULL DEFAULT 7703,
  bituach_briut_self_low_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0323,
  bituach_briut_self_high_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0517,
  mas_yasaf_threshold_annual NUMERIC(12,2) NOT NULL DEFAULT 721560,
  mas_yasaf_rate NUMERIC(5,4) NOT NULL DEFAULT 0.03,
  yishuv_mezake_rates JSONB NOT NULL DEFAULT '{"A": 0.20, "B": 0.10}',
  yishuv_mezake_income_ceiling NUMERIC(10,2) NOT NULL DEFAULT 199000,
  pension_employee_rate NUMERIC(5,4) NOT NULL DEFAULT 0.06,
  pension_employer_rate NUMERIC(5,4) NOT NULL DEFAULT 0.065,
  pension_employer_pitzuim_rate NUMERIC(5,4) NOT NULL DEFAULT 0.06,
  pension_max_salary_for_deduction NUMERIC(10,2) NOT NULL DEFAULT 34900,
  -- קרן השתלמות שכיר
  study_fund_employer_rate NUMERIC(5,4) NOT NULL DEFAULT 0.075,
  study_fund_employee_rate NUMERIC(5,4) NOT NULL DEFAULT 0.025,
  study_fund_max_salary NUMERIC(10,2) NOT NULL DEFAULT 15712,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS recognized_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('A', 'B')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS self_employed_deductions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_amount NUMERIC(12,2),
  rate NUMERIC(5,4),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE tax_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognized_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_employed_deductions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_tax_params" ON tax_parameters;
DROP POLICY IF EXISTS "allow_read_settlements" ON recognized_settlements;
DROP POLICY IF EXISTS "allow_read_deductions" ON self_employed_deductions;

CREATE POLICY "allow_read_tax_params" ON tax_parameters FOR SELECT USING (true);
CREATE POLICY "allow_read_settlements" ON recognized_settlements FOR SELECT USING (true);
CREATE POLICY "allow_read_deductions" ON self_employed_deductions FOR SELECT USING (true);

-- Seed — מדרגות מס 2025
INSERT INTO tax_parameters (year, income_tax_brackets, credit_point_value_monthly, is_active)
VALUES (
  2025,
  '[
    {"from": 0,      "to": 81480,   "rate": 0.10, "label": "מדרגה 1"},
    {"from": 81480,  "to": 116760,  "rate": 0.14, "label": "מדרגה 2"},
    {"from": 116760, "to": 188280,  "rate": 0.20, "label": "מדרגה 3"},
    {"from": 188280, "to": 269280,  "rate": 0.31, "label": "מדרגה 4"},
    {"from": 269280, "to": 560280,  "rate": 0.35, "label": "מדרגה 5"},
    {"from": 560280, "to": 721560,  "rate": 0.47, "label": "מדרגה 6"},
    {"from": 721560, "to": null,    "rate": 0.50, "label": "מדרגה 7"}
  ]'::jsonb,
  242,
  TRUE
);

-- יישובים מזכים
INSERT INTO recognized_settlements (name, category) VALUES
  ('אילת', 'A'), ('מצפה רמון', 'A'), ('ירוחם', 'A'), ('דימונה', 'A'),
  ('ערד', 'A'), ('קריית שמונה', 'A'), ('מעלות-תרשיחא', 'A'),
  ('אופקים', 'A'), ('נתיבות', 'A'), ('שדרות', 'A'), ('רהט', 'A'),
  ('יוקנעם עילית', 'B'), ('כרמיאל', 'B'), ('צפת', 'B'),
  ('נהריה', 'B'), ('עכו', 'B'), ('בית שאן', 'B'), ('טבריה', 'B'),
  ('ביתר עילית', 'B'), ('בית שמש', 'B'), ('אלעד', 'B'),
  ('מודיעין עילית', 'B'), ('אשקלון', 'B'), ('באר שבע', 'B');

-- ניכויים לעצמאים
INSERT INTO self_employed_deductions (name, description, sort_order) VALUES
  ('הוצאות רכב', 'דלק, ביטוח, תחזוקה', 1),
  ('הוצאות מחשב וטכנולוגיה', 'חומרה, תוכנה, אינטרנט', 2),
  ('שכר דירה / מקום עסק', 'שכירות משרד או חלק מהבית', 3),
  ('הוצאות טלפון', 'נייד ונייח', 4),
  ('שיווק ופרסום', 'פרסומות, אתר, מיתוג', 5),
  ('הוצאות מקצועיות', 'רואה חשבון, ייעוץ משפטי, השתלמויות', 6),
  ('ביטוח עסקי', 'ביטוח עסקי ומקצועי', 7),
  ('ציוד ומכשור', 'כלים, מכשירים, ריהוט', 8);
