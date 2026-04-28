import { useEffect } from "react";

export type PortalTheme = "student" | "teacher" | "admin";

const ALL_CLASSES = ["teacher-portal", "admin-portal"];

export function usePortalTheme(portal: PortalTheme) {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove(...ALL_CLASSES);
    if (portal === "teacher") {
      el.classList.add("teacher-portal");
    } else if (portal === "admin") {
      el.classList.add("admin-portal");
    }
    return () => {
      el.classList.remove(...ALL_CLASSES);
    };
  }, [portal]);
}
