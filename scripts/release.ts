import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import pkg from "../package.json";

const root=resolve(import.meta.dirname,".."); const release=resolve(root,"release"); const staging=resolve(release,`llm-gladiator-arena-${pkg.version}`);
await rm(release,{recursive:true,force:true}); await mkdir(staging,{recursive:true});
await cp(resolve(root,"dist","index.html"),resolve(staging,"llm-gladiator-arena.html"));
await cp(resolve(root,"README.md"),resolve(staging,"README.md")); await cp(resolve(root,"schemas"),resolve(staging,"schemas"),{recursive:true});
const html=await readFile(resolve(staging,"llm-gladiator-arena.html"),"utf8"); if(/<script[^>]+src=|<link[^>]+href=/.test(html)) throw new Error("Standalone build still contains external assets.");
await writeFile(resolve(staging,"RELEASE.txt"),`LLM Gladiator Arena ${pkg.version}\nGenerated from canonical src/.\n`);
const zip=resolve(release,`llm-gladiator-arena-${pkg.version}.zip`); execFileSync("powershell.exe",["-NoProfile","-Command",`Compress-Archive -Path '${staging.replaceAll("'","''")}\\*' -DestinationPath '${zip.replaceAll("'","''")}' -Force`],{stdio:"inherit"});
await readFile(zip);
console.log(`Created ${zip}`);
