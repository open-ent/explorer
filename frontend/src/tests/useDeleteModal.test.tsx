import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const trash = { mutateAsync: vi.fn() };
vi.mock('~/services/queries', () => ({
  useDelete: () => ({ mutateAsync: vi.fn() }),
  useTrash: () => trash,
}));
vi.mock('~/store', () => ({ useIsTrash: () => false }));

import { useDeleteModal } from '~/features/ActionBar/Delete/useDeleteModal';

describe('useDeleteModal', () => {
  it('appelle onSuccess après une mise à la corbeille réussie', async () => {
    trash.mutateAsync.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeleteModal({ onSuccess }));
    await result.current.onDelete();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onSuccess si la mutation échoue (ex. 403) : la modale reste ouverte", async () => {
    trash.mutateAsync.mockRejectedValue(new Error('403'));
    const onSuccess = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useDeleteModal({ onSuccess }));
    await result.current.onDelete();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
