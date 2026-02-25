export type MergeState =
  | "equal" // Same in all three
  | "modified_left" // Left differs from Base, Right is same as Base
  | "modified_right" // Right differs from Base, Left is same as Base
  | "modified_both" // Left and Right changed identically
  | "conflict"; // Left and Right changed differently

export interface MergeBlock {
  id: string;
  state: MergeState;

  baseLines: string[];
  leftLines: string[];
  rightLines: string[];
  resultLines: string[];

  isResolved: boolean;
  leftAccepted: boolean;
  rightAccepted: boolean;
  leftSkipped: boolean;
  rightSkipped: boolean;
}
