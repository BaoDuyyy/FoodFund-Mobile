import React, { createContext, useContext, useState } from "react";

type Phase = { id: string; phaseName: string };
type PhaseContextType = {
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
};

const PhaseContext = createContext<PhaseContextType | undefined>(undefined);

export function PhaseProvider({ children }: { children: React.ReactNode }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  return (
    <PhaseContext.Provider value={{ phases, setPhases }}>
      {children}
    </PhaseContext.Provider>
  );
}

export function usePhaseContext() {
  const ctx = useContext(PhaseContext);
  if (!ctx) throw new Error("usePhaseContext must be used within PhaseProvider");
  return ctx;
}
