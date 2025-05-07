"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";

export default function OpportunityTypesClient({
  typeIds,
}: {
  typeIds: string[];
}) {
  const [types, setTypes] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      setLoading(true);
      const fetched = await Promise.all(
        typeIds.map(async (id) => {
          try {
            return api.type.getTypeById.useQuery({ typeId: id });
          } catch (error) {
            console.error("Error fetching type:", error);
            return [];
          }
        }),
      );
      setTypes(fetched.filter(Boolean)); // remove nulls
      setLoading(false);
    };
    void fetchTypes();
  }, [typeIds]);

  if (loading) return <div className="h-[20px] w-[100px] rounded-full" />;

  return (
    <div className="my-4">
      <h2 className="text-xl font-semibold">Tags:</h2>
      <ul className="flex flex-wrap gap-2">
        {types.map((type: TagTypes) => (
          <li key={type.id} className="rounded bg-gray-100 px-3 py-1 text-sm">
            {type.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
