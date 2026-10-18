export interface MigrationPlan {
  kind: 'delivery-migration-preview';
  projectRoot: string;
  deliveryId: string;
  sourceVersion: 1;
  expectedNumber: number;
  migrationRunRef: string;
  inputs: { ref: string; content: string | null }[];
  executionEntries: string[];
  project: Record<string, unknown>;
  manifest: Record<string, unknown>;
  progress: { activeChangeId: string | null; deliveryRunRef: unknown; bindings: unknown };
  differences: string[];
  limitations: string[];
}
