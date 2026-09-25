import { useId } from 'react';

import { FOLDER } from '@open-ent/client';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { useCreateFolder, useUpdatefolder } from '~/services/queries';
import { useCurrentFolder, useSelectedFolders } from '~/store';

interface useFolderModalProps {
  edit: boolean;
  onSuccess?: () => void;
  onClose: () => void;
}

interface HandlerProps {
  name: string;
}

export function useFolderModal({
  edit,
  onSuccess,
  onClose,
}: useFolderModalProps) {
  // * https://github.com/pmndrs/zustand#fetching-everything
  // ! https://github.com/pmndrs/zustand/discussions/913

  const selectedFolders = useSelectedFolders();
  const currentFolder = useCurrentFolder();
  const createFolder = useCreateFolder();
  const updatefolder = useUpdatefolder();

  const name = edit ? selectedFolders[0]?.name : undefined;
  const {
    reset,
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<HandlerProps>({
    mode: 'onChange',
    values: { name: name || '' },
  });

  const id = useId();

  const onSubmit: SubmitHandler<HandlerProps> = async function ({
    name,
  }: HandlerProps) {
    try {
      if (edit) {
        const parentId = selectedFolders[0]?.parentId;
        const folder = selectedFolders[0];
        const folderId = folder!.id;
        await updatefolder.mutateAsync({ folderId, parentId, name });
      } else {
        const parentId = currentFolder?.id || FOLDER.DEFAULT;
        await createFolder.mutateAsync({ name, parentId });
      }
      reset();
      onSuccess?.();
    } catch {
      // The mutation's onError already displays a toast; nothing left to do
      // here besides keeping the form open with its current values.
    }
  };

  function onCancel() {
    reset();
    onClose();
  }

  const formId = `createModal_${id}`;

  return {
    formId,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    register,
    setFocus,
    handleSubmit,
    onCancel,
    onSubmit,
  };
}
