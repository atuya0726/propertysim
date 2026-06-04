import { simulate } from "./core/calculator";
import type { SimInput } from "./core/types";

(window as unknown as Record<string, unknown>)["simulate"] = simulate;
(window as unknown as Record<string, unknown>)["SimInput"] = {} as SimInput;
