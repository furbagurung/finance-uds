"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TransactionType = "INVESTMENT" | "INCOME" | "EXPENSE" | "WITHDRAWAL";

const transactionTypes: TransactionType[] = [
  "INVESTMENT",
  "INCOME",
  "EXPENSE",
  "WITHDRAWAL",
];
type CreatedCategory = {
  id: string;
  name: string;
  type: TransactionType;
  description?: string | null;
};

type CategoryFormProps = {
  /**
   * page  = normal full page form
   * modal = form used inside popup modal
   */
  mode?: "page" | "modal";

  /**
   * Preselects category type when creating from transaction form.
   */
  defaultType?: TransactionType;

  /**
   * Runs after successful category creation.
   * Useful for closing modal from parent component.
   */
  onSuccess?: () => void;

  /**
   * Runs with the newly created category.
   * Useful for refreshing dropdown and auto-selecting the new category.
   */
  onCreated?: (category: CreatedCategory) => void;

  /**
   * Runs when cancel is clicked.
   * Useful for closing modal instead of redirecting.
   */
  onCancel?: () => void;
};
export function CategoryForm({
  mode = "page",
  defaultType = "EXPENSE",
  onSuccess,
  onCreated,
  onCancel,
}: CategoryFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create category.");
        return;
      }

      if (mode === "modal") {
        if (data.category) {
          onCreated?.(data.category);
        }

        router.refresh();
        onSuccess?.();
        return;
      }
      router.push("/categories");
      router.refresh();
    } catch {
      setError("Something went wrong while creating category.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Category</CardTitle>
        <CardDescription>
          Create a custom category for investment, income, expense, or
          withdrawal tracking.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Meta Ads Refund / Video Production / Partner Investment"
            />
          </div>

          <div className="space-y-2">
            <Label>Category Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as TransactionType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category type" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description for this category..."
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (mode === "modal") {
                  onCancel?.();
                  return;
                }

                router.push("/categories");
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}