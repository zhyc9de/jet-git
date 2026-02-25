import type { Bridge } from "./types";
import { createVSCodeBridge } from "./vscode-bridge";

export const bridge: Bridge = createVSCodeBridge();

export type {
  Bridge,
  EventMessage,
  RequestMessage,
  ResponseMessage,
} from "./types";
