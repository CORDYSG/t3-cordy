// app/c/page.tsx
import { redirect } from "next/navigation";

const OPage = async ({
  params,
}: {
  params: Promise<{ organisationShortName: string }>;
}) => {
  // Anyone who hits /c gets redirected

  redirect("/c/" + (await params).organisationShortName);
};

export default OPage;
