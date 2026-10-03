import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-16">
      <AccountNav />
      <div className="mt-10 md:mt-14">{children}</div>
    </div>
  );
}
