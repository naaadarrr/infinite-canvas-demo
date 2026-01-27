import React from 'react';

type DependencyFocusContextValue = {
  activeNodeId: string | null;
  toggleNode: (nodeId: string) => void;
};

const DependencyFocusContext = React.createContext<DependencyFocusContextValue>({
  activeNodeId: null,
  toggleNode: () => {},
});

export const DependencyFocusProvider = DependencyFocusContext.Provider;

export function useDependencyFocus() {
  return React.useContext(DependencyFocusContext);
}
