import React from 'react';

export type CanvasRole = 'viewer' | 'editor' | 'owner';

const CanvasRoleContext = React.createContext<CanvasRole>('editor');

export const CanvasRoleProvider = CanvasRoleContext.Provider;

export const useCanvasRole = () => React.useContext(CanvasRoleContext);
