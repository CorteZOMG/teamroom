import { useNavigate } from 'react-router-dom';
import { CloudImage } from './CloudImage';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  const userRole = course.members[0]?.role || 'STUDENT';
  const ownerMember = course.members.find(m => m.role === 'OWNER');
  const ownerName = ownerMember?.username || 'Викладач';

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="w-full max-w-[300px] h-[280px] rounded-[10px] p-4 cursor-pointer font-montserrat 
                 bg-gradient-to-br from-primary to-secondary 
                 transition-all duration-300 hover:shadow-xl hover:from-secondary hover:to-primary
                 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-white text-xl font-normal line-clamp-3" title={course.name}>
            {course.name}
          </h3>
          <p className="text-white/80 text-sm font-light mt-1">
            {ownerName}
          </p>
        </div>
        
        {/* Course photo */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
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
      </div>

      {/* Middle Content */}
      <div className="text-center my-auto">
        <p className="text-white/70 text-sm italic">
          Переглянути матеріали та завдання
        </p>
      </div>

      {/* Footer */}
      <div className="text-white/90 text-xs space-y-1 pt-2 border-t border-white/20">
        <div className="flex justify-between">
          <span>Ваша роль: <span className="font-semibold">{userRole}</span></span>
          <span>
            {course.members.length} {course.members.length === 1 ? 'учасник' : 'учасників'}
          </span>
        </div>
        {!course.isOpen && (
          <p className="text-red-300 text-xs font-semibold text-center pt-1">
            Курс закрито
          </p>
        )}
      </div>
    </div>
  );
}
