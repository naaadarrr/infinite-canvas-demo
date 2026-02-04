import React from 'react';

export interface SelectModeState {
  isActive: boolean;
  mediaType: string | null;
}

const defaultSelectMode: SelectModeState = {
  isActive: false,
  mediaType: null,
};

const SelectModeContext = React.createContext<SelectModeState>(defaultSelectMode);

export const SelectModeProvider = SelectModeContext.Provider;

export const useSelectMode = () => React.useContext(SelectModeContext);
