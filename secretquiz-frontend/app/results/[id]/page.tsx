import { ResultsPageClient } from "@/components/ResultsPageClient";

// Generate static params for submission IDs (required for static export)
// In production, you might want to fetch actual submission IDs from the contract
// For now, we pre-generate a reasonable range of IDs
export async function generateStaticParams() {
  // Generate static params for submission IDs 0-9
  // This covers most common use cases while keeping build time reasonable
  return Array.from({ length: 10 }, (_, i) => ({
    id: i.toString(),
  }));
}

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ResultsPageClient submissionId={resolvedParams.id} />;
}
