import SubjectClient from './SubjectClient';

export async function generateStaticParams() {
  return [];
}

export default async function SubjectCoursesPage({ params }: { params: any }) {
  const resolvedParams = await params;
  return <SubjectClient params={resolvedParams} />;
}
