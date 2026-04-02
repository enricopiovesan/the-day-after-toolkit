/*
 * File-system helpers shared across commands.
 */

import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}
