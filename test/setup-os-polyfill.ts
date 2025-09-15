import os from "node:os";

const osModule = os as unknown as {
  availableParallelism?: () => number;
};

if (typeof osModule.availableParallelism !== "function") {
  osModule.availableParallelism = () => 1;
}
