const { exec } = require("child_process");
const path = require("path");

const swaggerPath = path.resolve(__dirname, "../src/config/swagger_v1.yaml");
const outputPath = path.resolve(__dirname, "../src/models/dto");

const command = `openapi-generator-cli generate \
  -i ${swaggerPath} \
  -g typescript-fetch \
  -o ${outputPath} \
  --global-property=models \
  --additional-properties=supportsES6=true,modelPackage=""`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`\nError executing OpenAPI Generator: ${error.message}`);
    console.error(
      `\nTry running: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass\n`
    );
    return;
  }
  if (stderr) {
    console.error(`\nStderr output: ${stderr}`);
    return;
  }
  console.log(`DTO Models generated successfully!`);
});
