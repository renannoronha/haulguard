const os = require("node:os");
const { randomUUID } = require("node:crypto");

if (typeof os.availableParallelism !== "function") {
  os.availableParallelism = () => 1;
}

if (typeof global.crypto?.randomUUID !== "function") {
  global.crypto = {
    ...global.crypto,
    randomUUID,
  };
}
