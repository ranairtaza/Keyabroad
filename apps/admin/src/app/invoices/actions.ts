"use server";

import { createClient } from "@keyabroad/auth/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDraftInvoice(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const studentId = formData.get("student_id") as string;
  const currencyCode = formData.get("currency_code") as string;
  const dueDate = formData.get("due_date") as string;
  
  const descriptions = formData.getAll("item_description[]") as string[];
  const quantities = formData.getAll("item_quantity[]") as string[];
  const unitAmounts = formData.getAll("item_unit_amount[]") as string[];

  const { data: student } = await supabase
    .from("students")
    .select("assigned_counselor_id")
    .eq("id", studentId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("branch")
    .eq("id", student?.assigned_counselor_id)
    .single();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      student_id: studentId,
      branch: profile?.branch,
      assigned_counselor_id: student?.assigned_counselor_id,
      currency_code: currencyCode,
      due_date: new Date(dueDate).toISOString(),
      status: "DRAFT",
      created_by: user.id
    })
    .select()
    .single();

  if (invoiceError || !invoice) throw new Error(invoiceError?.message || "Failed to create invoice");

  const itemsToInsert = descriptions.map((desc, i) => ({
    invoice_id: invoice.id,
    description: desc,
    quantity: parseFloat(quantities[i]),
    unit_amount: parseFloat(unitAmounts[i])
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);
  if (itemsError) console.error("Failed to add items", itemsError);

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function issueInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "ISSUED", issued_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("status", "DRAFT");

  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function cancelInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "CANCELLED" })
    .eq("id", invoiceId)
    .in("status", ["DRAFT", "ISSUED"]);

  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function recordPaymentAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const invoiceId = formData.get("invoice_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const method = formData.get("method") as string;
  const referenceNumber = formData.get("reference_number") as string;
  const notes = formData.get("notes") as string;

  // Call the secure RPC
  const { data, error } = await supabase.rpc("record_payment", {
    p_invoice_id: invoiceId,
    p_amount: amount,
    p_method: method,
    p_reference_number: referenceNumber,
    p_notes: notes || null
  });

  if (error) {
    throw new Error(error.message || "Failed to record payment");
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/fees");
  
  redirect(`/receipt/${data}`); // Redirect to the newly generated receipt
}

export async function reversePaymentAction(paymentId: string, invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Since we don't have a reverse_payment RPC, we just securely update the status.
  // The enforce_amount_paid_immutability trigger on invoice updates will automatically recalculate balances.
  
  const { error: updateError } = await supabase
    .from("payments")
    .update({ status: "REVERSED", notes: "Reversed by admin", processed_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("status", "CONFIRMED");

  if (updateError) throw new Error(updateError.message);

  // Trigger invoice recalculation by touching the invoice
  await supabase.from("invoices").update({ updated_at: new Date().toISOString() }).eq("id", invoiceId);

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/fees");
}
