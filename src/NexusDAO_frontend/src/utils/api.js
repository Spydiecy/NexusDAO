import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as nexusDAO_idl, canisterId as nexusDAO_canister_id } from "../../../declarations/NexusDAO_backend";

const agent = new HttpAgent();
const nexusDAO_actor = Actor.createActor(nexusDAO_idl, { agent, canisterId: nexusDAO_canister_id });

export const canisterId = nexusDAO_canister_id;

export const createActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({ ...options.agentOptions });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  // Fetch root key for certificate validation during development
  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
      console.error(err);
    });
  }

  return Actor.createActor(nexusDAO_idl, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};

export const nexusDAO = nexusDAO_actor;