/**
 * Adapter: useImmerRecoilState for product-photography (resolves @/hooks/useImmerRecoilState)
 */
import { useRecoilState } from 'recoil-next';
import type { RecoilState } from 'recoil-next';
import { produce } from 'immer';

export default function useImmerRecoilState<T>(recoilState: RecoilState<T>) {
  const [value, setValue] = useRecoilState(recoilState);
  const setWithImmer = (fn: (draft: T) => void) => {
    setValue(produce(value, fn));
  };
  return [value, setWithImmer] as const;
}
