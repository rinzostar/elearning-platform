import SemesterClient from './SemesterClient';

export async function generateStaticParams() {
  return [];
}

export default async function SubjectsPage({ params }: { params: any }) {
  const resolvedParams = await params;
  return <SemesterClient params={resolvedParams} />;
}
