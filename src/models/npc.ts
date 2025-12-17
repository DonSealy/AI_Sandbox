export type NPC = {
  id: string;
  name: string;
  version: string;
  provenance?: { source?: string; created_by?: string; created_at?: string };
  attributes: Record<string, number>;
  skills: Record<string, number>;
  resistances?: Record<string, number>;
  temporary_modifiers?: Array<{ target: string; value: number; expires_at?: string | null; source?: string }>;
  tags?: string[];
  notes?: string;
};
