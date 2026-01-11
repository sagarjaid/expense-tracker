/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { format, parse } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Save, X } from "lucide-react";
import {
  categoryOptions,
  subcategories as staticSubcategories,
  fetchSubcategories,
} from "@/lib/utils";
import Header from "@/components/Header";

interface ParsedExpense {
  date: Date;
  description: string;
  amount: number;
  source: string;
  category: string;
  subcategory: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ParsedExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>("");
  const [subcategoriesMap, setSubcategoriesMap] = useState<
    Record<string, string[]>
  >({
    Needs: [],
    Wants: [],
    Investment: [],
  });

  // Fetch subcategories for all categories
  useEffect(() => {
    const fetchAllSubcategories = async () => {
      const subcats: Record<string, string[]> = {
        Needs: [],
        Wants: [],
        Investment: [],
      };

      for (const category of categoryOptions) {
        const fetched = await fetchSubcategories(category);
        subcats[category] =
          fetched.length > 0 ? fetched : staticSubcategories[category] || [];
      }

      setSubcategoriesMap(subcats);
    };

    fetchAllSubcategories();
  }, []);

  const parseAmount = (amountStr: string): number => {
    if (!amountStr) return 0;
    // Remove commas and any other non-numeric characters except decimal point
    const cleaned = amountStr.replace(/,/g, "").trim();
    const parsed = parseFloat(cleaned);
    // Check if parsing resulted in a valid number
    if (isNaN(parsed) || !isFinite(parsed)) {
      console.warn(`Could not parse amount: ${amountStr}`);
      return 0;
    }
    return parsed;
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    const cleaned = dateStr.trim();

    // Extract just the date part if there's a time component (e.g., "01-01-2026 0:43:08" -> "01-01-2026")
    const dateOnly = cleaned.split(/\s+/)[0];

    // Try DD-MM-YYYY format first (most common in Indian bank statements)
    try {
      const parsed = parse(dateOnly, "dd-MM-yyyy", new Date());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (e) {
      // Continue
    }

    // Try DD/MM/YYYY format
    try {
      const parsed = parse(dateOnly, "dd/MM/yyyy", new Date());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (e) {
      // Continue
    }

    // Try YYYY-MM-DD format (ISO)
    try {
      const parsed = parse(dateOnly, "yyyy-MM-dd", new Date());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (e) {
      // Continue
    }

    // Try native Date parsing as fallback
    try {
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      // Continue
    }

    return null;
  };

  // Proper CSV row parser that handles quoted fields
  const parseCSVRow = (line: string, delimiter: string): string[] => {
    const columns: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of column
        columns.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last column
    columns.push(current.trim());
    return columns;
  };

  const parseCSV = (csvText: string): ParsedExpense[] => {
    // Remove BOM if present and normalize line endings
    let normalizedText = csvText.replace(/^\uFEFF/, ""); // Remove BOM
    normalizedText = normalizedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n"); // Normalize line endings

    const lines = normalizedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const expenses: ParsedExpense[] = [];

    console.log("Total lines in CSV:", lines.length);
    console.log("First 10 lines:", lines.slice(0, 10));

    // Find the header row (contains "Transaction Date", "Value Date", etc.)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      // More flexible header detection
      if (
        lowerLine.includes("value date") ||
        lowerLine.includes("transaction date") ||
        (lowerLine.includes("date") &&
          lowerLine.includes("description") &&
          lowerLine.includes("amount"))
      ) {
        headerIndex = i;
        console.log(`Found header at line ${i + 1}: ${lines[i]}`);
        break;
      }
    }

    if (headerIndex === -1) {
      console.error("Available lines:", lines.slice(0, 5));
      throw new Error(
        "Could not find header row in CSV. Please ensure the file contains columns: Transaction Date, Value Date, Description, Amount, and Dr / Cr"
      );
    }

    // Parse header to find column indices
    const headerLine = lines[headerIndex];
    // Handle both tab and comma separated - prefer tab for bank statements
    // Detect delimiter once from header and use it consistently for all rows
    // Count tabs vs commas to determine the primary delimiter
    const tabCount = (headerLine.match(/\t/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;

    let headerDelimiter = "\t"; // Default to tab
    if (tabCount > commaCount) {
      headerDelimiter = "\t";
    } else if (commaCount > 0) {
      headerDelimiter = ",";
    }

    console.log(
      `Using delimiter: ${
        headerDelimiter === "\t" ? "TAB" : "COMMA"
      }, tabCount: ${tabCount}, commaCount: ${commaCount}`
    );

    // Use proper CSV parser for header
    const headers = parseCSVRow(headerLine, headerDelimiter).map((h) =>
      h.trim().toLowerCase()
    );
    console.log("Parsed headers:", headers);

    const valueDateIndex = headers.findIndex(
      (h) => h.includes("value date") || h.includes("transaction date")
    );
    const descriptionIndex = headers.findIndex((h) =>
      h.includes("description")
    );
    const amountIndex = headers.findIndex(
      (h) => h.includes("amount") && !h.includes("balance")
    );
    // Look for Dr/Cr column - more flexible matching
    const drCrIndex = headers.findIndex((h) => {
      const lower = h.toLowerCase();
      return (
        lower.includes("dr") ||
        lower.includes("cr") ||
        lower.includes("debit") ||
        lower.includes("credit")
      );
    });

    console.log("Column indices:", {
      valueDateIndex,
      descriptionIndex,
      amountIndex,
      drCrIndex,
    });

    if (
      valueDateIndex === -1 ||
      descriptionIndex === -1 ||
      amountIndex === -1 ||
      drCrIndex === -1
    ) {
      throw new Error(
        `Required columns not found. Found: ${headers.join(", ")}`
      );
    }

    // Parse data rows - use the same delimiter detected from header
    let processedCount = 0;
    let skippedCount = 0;

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip footer lines
      if (
        line.startsWith("Closing balance") ||
        line.startsWith("You may call") ||
        line.startsWith("Write to us") ||
        line.toLowerCase().includes("customer contact")
      ) {
        continue;
      }

      // Skip empty lines
      if (!line || line.trim().length === 0) {
        continue;
      }

      // Use proper CSV parser that handles quoted fields
      let columns = parseCSVRow(line, headerDelimiter);

      // If we don't have enough columns, try the alternative delimiter as fallback
      if (
        columns.length <
        Math.max(valueDateIndex, descriptionIndex, amountIndex, drCrIndex) + 1
      ) {
        const altDelimiter = headerDelimiter === "\t" ? "," : "\t";
        const altColumns = parseCSVRow(line, altDelimiter);
        if (altColumns.length > columns.length) {
          columns = altColumns;
          console.log(
            `Row ${i + 1}: Using alternative delimiter. Columns: ${
              columns.length
            }`
          );
        }
      }

      // Clean up columns - remove quotes if present
      columns = columns.map((col) => {
        let cleaned = col.trim();
        // Remove surrounding quotes if present
        if (
          (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
          (cleaned.startsWith("'") && cleaned.endsWith("'"))
        ) {
          cleaned = cleaned.slice(1, -1);
        }
        return cleaned;
      });

      // Debug: log the first few rows to see what we're getting
      if (i <= headerIndex + 5) {
        console.log(
          `Row ${i + 1} columns (${columns.length}):`,
          columns.map((c, idx) => `[${idx}]=${c.substring(0, 30)}`).join(" | ")
        );
      }

      // Skip lines that don't have enough columns
      // But be lenient - we need at least the maximum index we're looking for
      const minRequiredColumns =
        Math.max(valueDateIndex, descriptionIndex, amountIndex, drCrIndex) + 1;
      if (columns.length < minRequiredColumns) {
        // Try to pad with empty strings if we're close
        if (columns.length >= minRequiredColumns - 1) {
          while (columns.length < minRequiredColumns) {
            columns.push("");
          }
          console.log(
            `Row ${i + 1}: Padded columns from ${columns.length - 1} to ${
              columns.length
            }`
          );
        } else {
          console.warn(
            `Skipping row ${i + 1}: insufficient columns (found ${
              columns.length
            }, need at least ${minRequiredColumns}). Line: ${line.substring(
              0,
              100
            )}`
          );
          skippedCount++;
          continue;
        }
      }

      // Get values with fallback - if index is out of bounds, try to find by pattern
      let drCr = columns[drCrIndex]?.trim().toUpperCase() || "";

      // Fallback: if we can't find DR/Cr at expected index, search all columns
      if (!drCr || (drCr !== "DR" && drCr !== "CR")) {
        for (const col of columns) {
          const upper = col.trim().toUpperCase();
          if (upper === "DR" || upper === "CR") {
            drCr = upper;
            break;
          }
        }
      }

      // Only process DR (Debit) records - skip CR (Credit) records
      if (drCr !== "DR") {
        if (drCr) {
          console.log(`Row ${i + 1}: Skipping ${drCr} record (not DR)`);
        } else {
          console.warn(
            `Row ${
              i + 1
            }: Could not find DR/CR indicator. Columns: [${columns.join(
              " | "
            )}]`
          );
        }
        skippedCount++;
        continue;
      }

      let valueDateStr = columns[valueDateIndex]?.trim() || "";
      let description = columns[descriptionIndex]?.trim() || "";
      let amountStr = columns[amountIndex]?.trim() || "";

      // Fallback: if we can't find values at expected indices, try to find by pattern
      if (!valueDateStr && columns.length > 0) {
        // Look for date pattern in first few columns
        for (let j = 0; j < Math.min(3, columns.length); j++) {
          const col = columns[j]?.trim() || "";
          if (
            col.match(/^\d{2}-\d{2}-\d{4}/) ||
            col.match(/^\d{2}\/\d{2}\/\d{4}/)
          ) {
            valueDateStr = col;
            break;
          }
        }
      }

      // Check if amount was split due to comma in the value (e.g., "1,879.75" becomes ["1", "879.75"])
      // This happens when CSV has comma-separated values and amounts contain commas
      if (amountStr && amountIndex + 1 < columns.length) {
        const nextCol = columns[amountIndex + 1]?.trim() || "";
        // If current amount is just digits and next column looks like decimal part
        if (amountStr.match(/^\d+$/) && nextCol.match(/^\d+\.\d{2}$/)) {
          // Reconstruct: "1" + "879.75" = "1,879.75"
          amountStr = `${amountStr},${nextCol}`;
          console.log(
            `Row ${
              i + 1
            }: Reconstructed split amount from columns ${amountIndex} and ${
              amountIndex + 1
            }: ${amountStr}`
          );
        }
        // Also check if amount is incomplete (like "10" or "29" which might be "10,000" or "29,300")
        else if (
          amountStr.match(/^\d{1,2}$/) &&
          nextCol.match(/^\d{3}\.\d{2}$/)
        ) {
          // Reconstruct: "10" + "000.00" = "10,000.00" or "29" + "300.00" = "29,300.00"
          amountStr = `${amountStr},${nextCol}`;
          console.log(`Row ${i + 1}: Reconstructed split amount: ${amountStr}`);
        }
      }

      // If still no valid amount, search for amount pattern in nearby columns
      if (!amountStr || parseAmount(amountStr) <= 0) {
        // Look for amount pattern (numbers with commas/dots) in columns around expected index
        for (
          let j = Math.max(0, amountIndex - 2);
          j <= Math.min(columns.length - 1, amountIndex + 3);
          j++
        ) {
          const col = columns[j]?.trim() || "";
          // Check for complete amount pattern
          if (col.match(/^[\d,]+\.?\d{0,2}$/) && parseAmount(col) > 0) {
            amountStr = col;
            console.log(
              `Row ${i + 1}: Found amount in column ${j}: ${amountStr}`
            );
            break;
          }
          // Check if this and next column form a split amount
          if (j + 1 < columns.length) {
            const nextCol = columns[j + 1]?.trim() || "";
            if (col.match(/^\d+$/) && nextCol.match(/^\d+\.\d{2}$/)) {
              amountStr = `${col},${nextCol}`;
              console.log(
                `Row ${
                  i + 1
                }: Reconstructed split amount from columns ${j} and ${
                  j + 1
                }: ${amountStr}`
              );
              break;
            }
          }
        }
      }

      if (!description && descriptionIndex < columns.length) {
        // Try to get description from middle columns
        const midStart = Math.max(1, Math.floor(columns.length / 2) - 1);
        const midEnd = Math.min(
          columns.length - 1,
          Math.floor(columns.length / 2) + 2
        );
        for (let j = midStart; j < midEnd; j++) {
          const col = columns[j]?.trim() || "";
          if (
            col &&
            !col.match(/^[\d,]+\.?\d*$/) &&
            !col.match(/^(DR|CR)$/i) &&
            !col.match(/^\d{2}-\d{2}-\d{4}/)
          ) {
            description = col;
            break;
          }
        }
      }

      if (!valueDateStr || !amountStr) {
        console.warn(
          `Skipping row ${
            i + 1
          }: missing date or amount. Date: ${valueDateStr}, Amount: ${amountStr}, Columns: [${columns.join(
            " | "
          )}]`
        );
        skippedCount++;
        continue;
      }

      const date = parseDate(valueDateStr);
      if (!date) {
        console.warn(
          `Skipping row ${i + 1}: could not parse date "${valueDateStr}"`
        );
        skippedCount++;
        continue;
      }

      const amount = parseAmount(amountStr);
      if (amount <= 0) {
        console.warn(
          `Skipping row ${
            i + 1
          }: invalid amount "${amountStr}" (parsed as ${amount})`
        );
        skippedCount++;
        continue;
      }

      console.log(
        `✓ Parsed row ${
          i + 1
        }: Date=${valueDateStr}, Amount=${amountStr} (${amount}), Desc=${description.substring(
          0,
          30
        )}...`
      );
      processedCount++;

      const defaultCategory = categoryOptions[0];
      const defaultSubcategory =
        subcategoriesMap[defaultCategory]?.[0] ||
        staticSubcategories[defaultCategory]?.[0] ||
        "Other";

      expenses.push({
        date,
        description: description.trim() || "NULL",
        amount,
        source: "Bank A/C",
        category: defaultCategory,
        subcategory: defaultSubcategory,
      });
    }

    console.log(
      `Parsing complete: ${processedCount} expenses parsed, ${skippedCount} rows skipped`
    );
    return expenses;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        toast.error("No DR (Debit) records found in the CSV file");
        setLoading(false);
        return;
      }

      // Set default category and subcategory for each expense
      const defaultCategory = categoryOptions[0];
      const defaultSubcategory =
        subcategoriesMap[defaultCategory]?.[0] ||
        staticSubcategories[defaultCategory]?.[0] ||
        "Other";

      const expensesWithDefaults = parsed.map((exp) => ({
        ...exp,
        category: defaultCategory,
        subcategory: defaultSubcategory,
      }));

      setExpenses(expensesWithDefaults);
      toast.success(`Parsed ${parsed.length} expense(s) from CSV`, {
        duration: 4000,
      });

      // Log summary for debugging
      console.log(
        `Successfully parsed ${parsed.length} expenses. Amounts:`,
        parsed.map((e) => e.amount).join(", ")
      );
    } catch (error: any) {
      toast.error(`Error parsing CSV: ${error.message}`);
      console.error("CSV parsing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (index: number, category: string) => {
    const updated = [...expenses];
    updated[index].category = category;
    // Set default subcategory for the new category
    const defaultSubcategory =
      subcategoriesMap[category]?.[0] ||
      staticSubcategories[category]?.[0] ||
      "Other";
    updated[index].subcategory = defaultSubcategory;
    setExpenses(updated);
  };

  const handleSubcategoryChange = (index: number, subcategory: string) => {
    const updated = [...expenses];
    updated[index].subcategory = subcategory;
    setExpenses(updated);
  };

  const handleDescriptionClick = (index: number) => {
    setEditingIndex(index);
    setEditingDescription(expenses[index].description);
  };

  const handleDescriptionChange = (value: string) => {
    setEditingDescription(value);
  };

  const handleDescriptionBlur = (index: number) => {
    if (editingIndex === index) {
      const updated = [...expenses];
      updated[index].description = editingDescription.trim() || "NULL";
      setExpenses(updated);
      setEditingIndex(null);
      setEditingDescription("");
    }
  };

  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditingDescription("");
    }
  };

  const handleDelete = (index: number) => {
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated);
  };

  const handleCancel = () => {
    setExpenses([]);
    // Reset file input
    const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSave = async () => {
    if (expenses.length === 0) {
      toast.error("No expenses to save");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      toast.error("User not authenticated");
      setSaving(false);
      return;
    }

    // Convert expenses to database format
    const expensesToSave = expenses.map((exp) => {
      const userDate = new Date(exp.date);
      const localDate = new Date(
        userDate.getTime() - userDate.getTimezoneOffset() * 60000
      );

      return {
        user_id: user.id,
        amount: exp.amount,
        description: exp.description.trim() === "" ? "NULL" : exp.description,
        category: exp.category,
        subcategory: exp.subcategory,
        date: format(localDate, "yyyy-MM-dd"),
        source: exp.source,
      };
    });

    const { error } = await supabase.from("expenses").insert(expensesToSave);

    if (error) {
      toast.error(`Error saving expenses: ${error.message}`);
      setSaving(false);
    } else {
      toast.success(`Successfully saved ${expenses.length} expense(s)!`);
      setExpenses([]);
      setSaving(false);
      // Redirect to home page after successful save
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="max-w-6xl mx-auto p-4 mt-16 sm:p-6">
        {expenses.length === 0 && (
          <div className=" w-fit mx-auto border border-border rounded-lg p-4 pt-8 flex flex-col items-center justify-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
              Upload Bank Statement CSV
            </h1>

            <div className="mb-6 flex flex-col items-center">
              <label className="block mb-2">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={loading}
                />
                <Button
                  asChild
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {loading ? "Parsing CSV..." : "Upload CSV File"}
                  </label>
                </Button>
              </label>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Upload a bank statement CSV file. Only DR (Debit) transactions
                will be imported.
              </p>
            </div>
          </div>
        )}

        {expenses.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {expenses.length} expense(s) to review
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Records"}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="border border-border p-2 text-left text-sm font-medium">
                      Category
                    </th>
                    <th className="border border-border p-2 text-left text-sm font-medium">
                      Subcategory
                    </th>
                    <th className="border border-border p-2 text-left text-sm font-medium">
                      Description
                    </th>
                    <th className="border border-border p-2 text-left text-sm font-medium">
                      Source
                    </th>
                    <th className="border border-border p-2 text-left text-sm font-medium">
                      Amount
                    </th>
                    <th className="border border-border p-2 text-left text-sm font-medium">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="border border-border p-2 text-sm">
                        {format(expense.date, "dd-MM-yyyy")}
                      </td>
                      <td className="border border-border p-2">
                        <select
                          value={expense.category}
                          onChange={(e) =>
                            handleCategoryChange(index, e.target.value)
                          }
                          className="w-full h-9 rounded-md border border-border px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-border p-2">
                        <select
                          value={expense.subcategory}
                          onChange={(e) =>
                            handleSubcategoryChange(index, e.target.value)
                          }
                          className="w-full h-9 rounded-md border border-border px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {(
                            subcategoriesMap[expense.category] ||
                            staticSubcategories[expense.category] ||
                            []
                          ).map((subcat) => (
                            <option key={subcat} value={subcat}>
                              {subcat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-border p-2 text-sm max-w-xs">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={editingDescription}
                            onChange={(e) =>
                              handleDescriptionChange(e.target.value)
                            }
                            onBlur={() => handleDescriptionBlur(index)}
                            onKeyDown={(e) =>
                              handleDescriptionKeyDown(e, index)
                            }
                            className="w-full h-9 rounded-md border border-border px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => handleDescriptionClick(index)}
                            className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 min-h-[2.25rem] flex items-center truncate"
                            title={expense.description}
                          >
                            {expense.description}
                          </div>
                        )}
                      </td>
                      <td className="border border-border p-2 text-sm">
                        {expense.source}
                      </td>
                      <td className="border border-border p-2 text-sm font-medium">
                        ₹{expense.amount.toFixed(2)}
                      </td>
                      <td className="border border-border p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
