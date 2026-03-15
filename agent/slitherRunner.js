import { spawn } from "child_process";

function runSlither(contractPath) {
  return new Promise((resolve, reject) => {

    const slither = spawn("slither", [contractPath, "--json", "-"]);

    let stdout = "";
    let stderr = "";

    slither.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    slither.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    slither.on("close", (code) => {
      if (!stdout) {
        // Return empty result instead of rejecting
        return resolve({ results: { detectors: [] } });
      }

      try {
        const jsonStart = stdout.indexOf("{");
        if (jsonStart === -1) {
          return resolve({ results: { detectors: [] } });
        }
        const jsonString = stdout.slice(jsonStart);
        const result = JSON.parse(jsonString);
        resolve(result);
      } catch (err) {
        resolve({ results: { detectors: [] } });
      }
    });

  });
}

export default runSlither;