ALTER TABLE tasks ADD COLUMN queue_position DOUBLE PRECISION DEFAULT 0;
CREATE INDEX idx_tasks_queue_position ON tasks(queue_position);
