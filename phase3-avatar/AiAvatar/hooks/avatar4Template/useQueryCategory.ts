'use client';

export function useQueryAvatar4Category() {
  const collectionCategories = [
    { collectionId: 'conference', collectionName: '🎤Conference/Public Speaking' },
    { collectionId: 'lifestyle', collectionName: '🌿Lifestyle/UGC' },
    { collectionId: 'doctor', collectionName: '🏥Doctor/Expert' },
    { collectionId: 'fashion', collectionName: '👗Fashion/Model' },
    { collectionId: 'tech', collectionName: '💻Tech/Geek' },
    { collectionId: 'business', collectionName: '💼Business/Profession' },
    { collectionId: 'fitness', collectionName: '💪Fitness/Sport' }
  ];
  return { collectionCategories, collectionLoading: false };
}

export default useQueryAvatar4Category;
