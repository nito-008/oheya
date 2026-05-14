import { component$ } from "@builder.io/qwik";
import iconFrameSvg from "~/media/icon-frame.svg";
import iconPlaceholderSvg from "~/media/icon-placeholder.svg";
import profilePlusSvg from "~/media/profile-plus.svg";
import nextHintSvg from "~/media/scroll-hint.svg";
import { getImageUrl } from "~/schema/image";
import styles from "./profile.module.css";

type ProfileProps = {
  profile: {
    icon: string | null;
    name: string;
    publicId: string;
  };
};

export const Profile = component$<ProfileProps>(({ profile }) => {
  return (
    <section id="profile" class={styles.profile} aria-label="プロフィール">
      <div class={styles.profileBlock}>
        <img
          class={`${styles.cornerPlus} ${styles.cornerPlusTopLeft}`}
          src={profilePlusSvg}
          width={40}
          height={40}
          alt=""
          aria-hidden="true"
        />
        <span class={styles.avatar}>
          {profile.icon ? (
            <img
              src={getImageUrl(profile.icon) ?? ""}
              alt={`${profile.name}のアイコン`}
              width={96}
              height={96}
              class={styles.avatarImage}
            />
          ) : (
            <img
              aria-hidden="true"
              src={iconPlaceholderSvg}
              alt=""
              width={96}
              height={96}
              class={styles.avatarPlaceholder}
            />
          )}
          <img
            aria-hidden="true"
            src={iconFrameSvg}
            alt=""
            width={96}
            height={96}
            class={styles.avatarFrame}
          />
        </span>
        <h1 class={styles.profileName}>{profile.name}</h1>
        <p class={styles.profileHandle}>@{profile.publicId}</p>
        <img
          class={`${styles.cornerPlus} ${styles.cornerPlusBottomRight}`}
          src={profilePlusSvg}
          width={40}
          height={40}
          alt=""
          aria-hidden="true"
        />
      </div>
      <img class={styles.nextHint} src={nextHintSvg} width={88} height={32} alt="スクロール" />
    </section>
  );
});
