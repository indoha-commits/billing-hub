-- Seed cargo-driven pricing tiers (VAT included)

-- Currency: adjust if you bill in different currencies.

INSERT INTO public.pricing_tiers (tier_code, name, cargo_min, cargo_max, price_amount, currency, vat_included, active)
SELECT * FROM (
  VALUES
    ('starter', 'Starter', 1, 200, 1227200::numeric, 'RWF', true, true),
    ('most_popular', 'Most Popular', 201, 500, 2684500::numeric, 'RWF', true, true),
    ('advanced', 'Advanced', 501, 1500, 6766500::numeric, 'RWF', true, true)
) AS v(tier_code, name, cargo_min, cargo_max, price_amount, currency, vat_included, active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.pricing_tiers t WHERE t.tier_code = v.tier_code
);

-- NOTE: prices are set to 0 for now because you didn't specify amounts.
-- Update price_amount later per tier.
