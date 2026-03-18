'use client';

import { User, Star, Search } from 'lucide-react';

export enum EmptyStateType {
  MY_AVATAR = 'my-avatar',
  FAVORITE = 'favorite',
  NO_RESULTS = 'no-results'
}

export interface EmptyStateProps {
  /** 空状态类型 */
  type: EmptyStateType;
}

export function EmptyState({ type }: EmptyStateProps) {
  if (type === EmptyStateType.MY_AVATAR) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center text-white/40'>
        <User
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-center text-sm'>
          Your used product avatar photos will appear here
        </p>
      </div>
    );
  }

  if (type === EmptyStateType.FAVORITE) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center text-white/40'>
        <Star
          size={48}
          className='mb-3 opacity-50'
        />
        <p className='text-center text-sm'>No favorite product avatars yet</p>
        <p className='mt-1 text-center text-xs opacity-70'>
          Click the star icon on any template to add it to favorites
        </p>
      </div>
    );
  }

  // type === EmptyStateType.NO_RESULTS
  return (
    <div className='flex flex-1 flex-col items-center justify-center text-white/40'>
      <Search
        size={48}
        className='mb-3 opacity-50'
      />
      <p className='text-center text-sm'>No templates found</p>
      <p className='mt-1 text-center text-xs opacity-70'>
        Try adjusting your filters
      </p>
    </div>
  );
}
