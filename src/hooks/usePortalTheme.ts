import { useEffect } from "react";

export function usePortalTheme(portal: "student" | "teacher") {
  useEffect(() => {
    const el = document.documentElement;
    if (portal === "teacher") {
      el.classList.add("teacher-portal");
    } else {
      el.classList.remove("teacher-portal");
    }
    return () => {
      el.classList.remove("teacher-portal");
    };
  }, [portal]);
}
