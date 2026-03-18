// Prompts Mode Tab - 提示词模式组件

import { SelectParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/SelectParameter';
import { CountrySelectParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/CountrySelectParameter';
import type { DesignMyAvatarFormValues } from '../../type';
import {
  GENDER_OPTIONS,
  AGE_OPTIONS,
  COUNTRY_OPTIONS,
  DEFAULT_VALUES
} from '../../config';

interface PromptsModeTabProps {
  formValues: DesignMyAvatarFormValues;
  onValueChange: <K extends keyof DesignMyAvatarFormValues>(
    key: K,
    value: DesignMyAvatarFormValues[K]
  ) => void;
}

export function PromptsModeTab({
  formValues,
  onValueChange
}: PromptsModeTabProps) {
  return (
    <>
      {/* Gender */}
      <SelectParameter
        label='Gender'
        options={GENDER_OPTIONS}
        value={formValues.gender}
        defaultValue={DEFAULT_VALUES.gender}
        onChange={(value) => onValueChange('gender', value)}
      />

      {/* Age */}
      <SelectParameter
        label='Age'
        options={AGE_OPTIONS}
        value={formValues.age}
        defaultValue={DEFAULT_VALUES.age}
        onChange={(value) => onValueChange('age', value)}
      />

      {/* Country / Region */}
      <CountrySelectParameter
        label='Country / Region'
        options={COUNTRY_OPTIONS}
        value={formValues.country}
        defaultValue={DEFAULT_VALUES.country}
        onChange={(value) => onValueChange('country', value)}
      />
    </>
  );
}
