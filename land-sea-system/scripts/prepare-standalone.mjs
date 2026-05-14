import fs from "fs";
import path from "path";

function copyIntoStandalone(sourceRelativePath, destinationRelativePath) {
  const projectRoot = process.cwd();
  const sourcePath = path.join(projectRoot, sourceRelativePath);
  const destinationPath = path.join(
    projectRoot,
    ".next",
    "standalone",
    destinationRelativePath
  );

  if (!fs.existsSync(sourcePath)) {
    return;
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.rmSync(destinationPath, { recursive: true, force: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

copyIntoStandalone(path.join(".next", "static"), path.join(".next", "static"));
copyIntoStandalone("public", "public");

console.log("Prepared standalone output with static and public assets.");
