import { useNavigate } from 'react-router-dom';
import { CloudImage } from './CloudImage';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  // Get user's role in the course (first member is assumed to be current user for now)
  const userRole = course.members[0]?.role || 'STUDENT';

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get the first member's (owner's) name for display
  const ownerMember = course.members.find(m => m.role === 'OWNER');
  const ownerName = ownerMember?.username || 'Викладач';

  // Get course creation date from first member
  const courseDate = course.members[0]?.createdAt;

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-full max-w-[220px] h-[280px] bg-gradient-to-br from-primary to-secondary rounded-[10px] p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg font-montserrat"
    >
      {/* Course name */}
      <h3 className="text-white text-xl font-normal mb-2 line-clamp-2">
        {course.name}
      </h3>

      {/* Owner name */}
      <p className="text-white/80 text-sm font-light mb-4">
        {ownerName}
      </p>

      {/* Course photo - circular avatar */}
      <div className="absolute top-4 right-4 w-16 h-16 rounded-full overflow-hidden bg-white/20">
        {course.photoUrl ? (
          <CloudImage
            publicLink={course.photoUrl}
            alt={course.name}
            className="w-full h-full object-cover"
            fallbackSrc=""
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-2xl font-medium">
            {course.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Course info at bottom */}
      <div className="absolute bottom-4 left-4 right-4 text-white/90 text-xs space-y-1">
        {courseDate && (
          <>
            <p>{formatDate(courseDate)}</p>
            <p>{userRole}</p>
          </>
        )}
        <p className="mt-2">
          {course.members.length} {course.members.length === 1 ? 'учасник' : 'учасників'}
        </p>
        {!course.isOpen && (
          <p className="text-red-300 text-xs mt-1">
            Курс закрито
          </p>
        )}
      </div>
    </div>
  );
}


