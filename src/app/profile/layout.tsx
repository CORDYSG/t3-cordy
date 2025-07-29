const ProfileLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4 p-8 md:w-5/6">
      {children}
    </main>
  );
};

export default ProfileLayout;
