import { machineId } from "node-machine-id";

export async function getMachineId(): Promise<string> {
  try {
    const id = await machineId();
    return id;
  } catch (error) {
    console.error("Erro ao obter machine ID:", error);
    throw error;
  }
}






















