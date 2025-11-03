import { QuizPageClient } from "@/components/QuizPageClient";

// Generate static params for quiz IDs (required for static export)
// In production, you might want to fetch actual quiz IDs from the contract
// For now, we pre-generate a reasonable range of IDs
export async function generateStaticParams() {
  // Generate static params for quiz IDs 0-9
  // This covers most common use cases while keeping build time reasonable
  return Array.from({ length: 10 }, (_, i) => ({
    id: i.toString(),
  }));
}

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <QuizPageClient quizId={resolvedParams.id} />;
}
