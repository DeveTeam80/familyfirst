"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser, selectCurrentUser } from "@/store/userSlice";

export default function SessionRefresher() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isFetching = useRef(false);

  useEffect(() => {
    const revalidateUser = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            // 🔧 FIX: Merge memberships into the user object so selectors can find them
            const fullUser = {
              ...data.user,
              memberships: data.memberships || [], 
              familyMemberships: data.memberships || [] // Support both naming conventions
            };

            // Check if we actually need to update Redux (prevent loops)
            const newId = fullUser.id;
            const currentId = currentUser?.id;
            const newRole = fullUser.role || fullUser.memberships?.[0]?.role;
            const currentRole = currentUser?.role || currentUser?.memberships?.[0]?.role;

            if (newId === currentId && newRole === currentRole) {
               // Data is fresh, do nothing
            } else {
               dispatch(setCurrentUser(fullUser)); 
               console.log("🔄 Session refreshed & Memberships merged. Role:", newRole);
            }
          }
        }
      } catch (err) {
        console.error("Silent refresh failed", err);
      } finally {
        isFetching.current = false;
      }
    };

    revalidateUser();
    
    const onFocus = () => revalidateUser();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, [dispatch, currentUser?.id, currentUser?.role]); // Depend on ID/Role to re-run if they change

  return null;
}