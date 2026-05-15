import { createContextId, useContext } from "@builder.io/qwik";

export type CommonHeaderUser = {
  authenticated: boolean;
  publicId: string | null;
  name: string | null;
  icon: string | null;
};

export type CommonHeaderUserState = CommonHeaderUser;

export const CommonHeaderUserContext = createContextId<CommonHeaderUserState>("common-header.user");

export const useCommonHeaderUser = () => useContext(CommonHeaderUserContext);

export const getCommonUserRoomHref = (user: Pick<CommonHeaderUser, "publicId">) =>
  user.publicId ? `/${user.publicId}/` : "/settings/profile/";

export const getCommonUserDisplayName = (user: Pick<CommonHeaderUser, "name">) =>
  user.name?.trim() || "アカウント";

export const getCommonUserInitial = (user: Pick<CommonHeaderUser, "name">) =>
  getCommonUserDisplayName(user).slice(0, 1).toUpperCase();
