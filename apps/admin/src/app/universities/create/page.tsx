"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/auth/client";

import { Button } from "@/lib/ui/components/button";
import { Input } from "@/lib/ui/components/input";
import { Textarea } from "@/lib/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/lib/ui/components/card";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import Link from "next/link";

const universitySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  slug: z.string().min(2, { message: "Slug is required." }),
  url: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal("")),
  country_id: z.string().uuid({ message: "Valid Country ID is required." }),
  city: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

type UniversityFormValues = z.input<typeof universitySchema>;

export default function CreateUniversityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UniversityFormValues>({
    resolver: zodResolver(universitySchema),
    defaultValues: {
      name: "",
      slug: "",
      url: "",
      country_id: "", // In a real scenario, this would be a select dropdown fetched from the 'countries' table
      city: "",
      description: "",
      status: "draft" as "draft" | "published" | "archived",
    },
  });

  const generateSlug = () => {
    const name = form.getValues("name");
    if (name) {
      form.setValue("slug", name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  };

  const onSubmit = async (data: UniversityFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from("universities")
        .insert({
          name: data.name,
          slug: data.slug,
          url: data.url || null,
          country_id: data.country_id,
          city: data.city || null,
          description: data.description || null,
          status: data.status,
        });

      if (submitError) throw submitError;

      router.push("/universities");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create university. Please verify the Country ID exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/universities">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New University</h1>
          <p className="text-muted-foreground">Create a new partner university in the catalog.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            University Details
          </CardTitle>
          <CardDescription>Enter the core information for this institution.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">University Name *</label>
                <Input 
                  placeholder="e.g. Harvard University" 
                  {...form.register("name")}
                  onBlur={generateSlug}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL Slug *</label>
                <Input 
                  placeholder="e.g. harvard-university" 
                  {...form.register("slug")}
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Country ID (UUID) *</label>
                <Input 
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000" 
                  {...form.register("country_id")}
                />
                {form.formState.errors.country_id && (
                  <p className="text-sm text-red-500">{form.formState.errors.country_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input 
                  placeholder="e.g. Cambridge" 
                  {...form.register("city")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Official Website URL</label>
                <Input 
                  placeholder="https://www.harvard.edu" 
                  {...form.register("url")}
                />
                {form.formState.errors.url && (
                  <p className="text-sm text-red-500">{form.formState.errors.url.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="A brief overview of the university..." 
                  className="min-h-[100px]"
                  {...form.register("description")}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save University"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
