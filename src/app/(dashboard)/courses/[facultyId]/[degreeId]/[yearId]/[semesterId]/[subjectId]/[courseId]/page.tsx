import CourseClient from './CourseClient';

export async function generateStaticParams() {
  return [];
}

export default async function ViewCourseModulePage({ params }: { params: any }) {
  const resolvedParams = await params;
  return <CourseClient params={resolvedParams} />;
}
