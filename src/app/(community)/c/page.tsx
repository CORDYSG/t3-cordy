// app/c/page.tsx
import { redirect } from "next/navigation";

export default function CPage() {
  // Anyone who hits /c gets redirected

  redirect("/opportunities");
}
