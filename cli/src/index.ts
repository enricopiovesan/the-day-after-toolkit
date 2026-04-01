/*
 * Registers the command surface for the cdad CLI.
 * Each command implementation lives in its own module so spec-driven behavior
 * can be implemented and tested independently.
 */

import { Command } from "commander";

import { registerCheckCommand } from "./commands/check.js";
import { registerRoadmapCommand } from "./commands/roadmap.js";
import { registerInitCommand } from "./commands/init.js";
import { registerValidateCommand } from "./commands/validate.js";
import { registerGraphCommand } from "./commands/graph.js";

const program = new Command();

program.name("cdad").description("Is your codebase ready for AI agents?");

registerCheckCommand(program);
registerRoadmapCommand(program);
registerInitCommand(program);
registerValidateCommand(program);
registerGraphCommand(program);

program.parseAsync(process.argv);
