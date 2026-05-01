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
