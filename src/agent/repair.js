export const MAX_REPAIR_CYCLES=6;
export function makeRepairRequest({spec,failures,attempt,evidence}){return{objective:'Repair only failures. Do not weaken tests, remove verification, broaden permissions, or alter unrelated files.',attempt,maxAttempts:MAX_REPAIR_CYCLES,spec,failures,evidence};}
export function shouldRepair(contract,attempt){return Boolean(!contract.passed&&attempt<MAX_REPAIR_CYCLES&&contract.failures?.length);}
