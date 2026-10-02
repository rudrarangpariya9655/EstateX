"use client";

import { useRouter } from "next/navigation";
import { setUserRoleAction } from "@/app/actions/admin";
import { useToast } from "@/components/providers/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { UserRole } from "@/lib/types";

export function RoleToggle({ userId, name, role }: { userId: string; name: string; role: UserRole }) {
  const router = useRouter();
  const { notify } = useToast();
  const next: UserRole = role === "admin" ? "user" : "admin";
  return (
    <ConfirmDialog
      title={next === "admin" ? `Make ${name} an administrator?` : `Remove ${name}'s administrator access?`}
      description={
        next === "admin"
          ? "Administrators can create, edit and delete properties, review visit requests and manage other users."
          : "They will keep their account, saved homes and visit requests, but lose access to administration."
      }
      confirmLabel={next === "admin" ? "Grant access" : "Remove access"}
      tone={next === "admin" ? "primary" : "danger"}
      onConfirm={async () => {
        const result = await setUserRoleAction(userId, next);
        notify(result.message, { tone: result.ok ? "neutral" : "error" });
        if (result.ok) router.refresh();
      }}
    >
      {(open) => (
        <button type="button" onClick={open} className="inline-flex min-h-10 items-center text-[0.8125rem] underline underline-offset-4 hover:text-accent">
          {next === "admin" ? "Make admin" : "Remove admin"}
        </button>
      )}
    </ConfirmDialog>
  );
}
