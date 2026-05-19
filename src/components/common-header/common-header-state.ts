import { createContextId, useContext } from "@builder.io/qwik";
import { getUserRoomHref } from "~/lib/room";

export type CommonHeaderUser = {
  authenticated: boolean;
  publicId: string | null;
  name: string | null;
  icon: string | null;
};

export type CommonHeaderUserState = CommonHeaderUser;

export const CommonHeaderUserContext = createContextId<CommonHeaderUserState>("common-header.user");

export const useCommonHeaderUser = () => useContext(CommonHeaderUserContext);

export const setCommonHeaderUser = (user: CommonHeaderUserState, nextUser: CommonHeaderUser) => {
  user.authenticated = nextUser.authenticated;
  user.publicId = nextUser.publicId;
  user.name = nextUser.name;
  user.icon = nextUser.icon;
};

export const clearCommonHeaderUser = (user: CommonHeaderUserState) => {
  setCommonHeaderUser(user, {
    authenticated: false,
    publicId: null,
    name: null,
    icon: null,
  });
};

export const getCommonUserRoomHref = (user: Pick<CommonHeaderUser, "publicId">) =>
  user.publicId ? getUserRoomHref(user.publicId) : "/settings/profile/";

export const getCommonUserDisplayName = (user: Pick<CommonHeaderUser, "name">) =>
  user.name?.trim() || "アカウント";

export const getCommonUserInitial = (user: Pick<CommonHeaderUser, "name">) =>
  getCommonUserDisplayName(user).slice(0, 1).toUpperCase();
