'use client';

import { getResourcePrefixed } from '@/utils/media';

interface GlobalLoadingProps {
  isLoading: boolean;
}

const GlobalLoading = ({ isLoading }: GlobalLoadingProps) => {
  return (
    <div
      className={`fixed top-0 left-0 flex justify-center items-center w-screen h-screen bg-[#161616] opacity-80 z-[99999] pointer-events-none ${
        isLoading ? 'visible' : 'invisible'
      }`}
    >
      <img
        src={getResourcePrefixed('board/public/common/loading_transparent.gif')}
        alt='Loading'
        className='w-[147px] h-[147px] object-cover'
      />
    </div>
  );
};

export default GlobalLoading;
