import { type IResource } from '@open-ent/client';

export function isResourceShared(resource: IResource) {
  const { rights, creatorId } = resource;
  const filteredRights = rights.filter((right) => !right.includes(creatorId));

  return filteredRights.length >= 1;
}
