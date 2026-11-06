CREATE TABLE IF NOT EXISTS inquiry_dogs (
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  PRIMARY KEY (inquiry_id, dog_id)
);
