import os from "node:os";
import { randomUUID } from "node:crypto";

const osModule = os as unknown as {
  availableParallelism?: () => number;
};

if (typeof osModule.availableParallelism !== "function") {
  osModule.availableParallelism = () => 1;
}

const globalCrypto = globalThis as { crypto?: { randomUUID?: () => string } };
if (typeof globalCrypto.crypto?.randomUUID !== "function") {
  globalCrypto.crypto = {
    ...globalCrypto.crypto,
    randomUUID,
  };
}
