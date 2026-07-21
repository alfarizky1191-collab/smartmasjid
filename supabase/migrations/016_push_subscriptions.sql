-- Migration: push_subscriptions table
-- Push notification subscriptions per mosque

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id     uuid        NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  endpoint      text        NOT NULL,
  p256dh        text        NOT NULL,  -- client public key
  auth          text        NOT NULL,  -- client auth secret
  user_agent    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  -- One subscription endpoint per mosque (upsert key)
  UNIQUE (mosque_id, endpoint)
);

-- Index for fast lookup by mosque
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_mosque_id
  ON push_subscriptions(mosque_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can insert their own subscription (identified by endpoint uniqueness)
CREATE POLICY "push_subscriptions_insert"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

-- Anyone can delete their own subscription (by endpoint)
CREATE POLICY "push_subscriptions_delete"
  ON push_subscriptions FOR DELETE
  USING (true);

-- Anyone can SELECT (required for client-side upsert to check conflicts)
CREATE POLICY "push_subscriptions_select"
  ON push_subscriptions FOR SELECT
  USING (true);

-- Anyone can UPDATE (to support client-side upsert conflicts)
CREATE POLICY "push_subscriptions_update"
  ON push_subscriptions FOR UPDATE
  USING (true)
  WITH CHECK (true);


