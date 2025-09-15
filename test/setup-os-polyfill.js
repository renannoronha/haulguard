const os = require("node:os");

if (typeof os.availableParallelism !== "function") {
  os.availableParallelism = () => 1;
}
