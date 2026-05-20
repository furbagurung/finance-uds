"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActivityFiltersProps = {
  selectedAction: string;
  selectedEntity: string;
};

const actions = [
  "ALL",
  "CREATE",
  "UPDATE",
  "DELETE",
  "UPLOAD",
  "LOGIN",
  "LOGOUT",
];

const entities = [
  "ALL",
  "TRANSACTION",
  "CLIENT",
  "PROJECT",
  "CATEGORY",
  "USER",
  "ATTACHMENT",
  "AUTH",
];

export function ActivityFilters({
  selectedAction,
  selectedEntity,
}: ActivityFiltersProps) {
  const router = useRouter();

  const [action, setAction] = useState(selectedAction || "ALL");
  const [entity, setEntity] = useState(selectedEntity || "ALL");

  function applyFilters() {
    const params = new URLSearchParams();

    if (action !== "ALL") params.set("action", action);
    if (entity !== "ALL") params.set("entity", entity);

    const query = params.toString();

    router.push(query ? `/activity?${query}` : "/activity");
  }

  function clearFilters() {
    setAction("ALL");
    setEntity("ALL");
    router.push("/activity");
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">Action</label>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger>
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            {actions.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "ALL" ? "All Actions" : item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Entity</label>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger>
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            {entities.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "ALL" ? "All Entities" : item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end gap-2">
        <Button type="button" onClick={applyFilters}>
          Apply
        </Button>

        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </div>
  );
}
