import { useState, useEffect, useCallback } from 'react';
import { getAssignmentResponses, gradeAssignmentResponse, returnAssignmentResponse, getAssignmentResponse, cancelGrade, cancelReturn } from '../api/courses';
import { FilePreview } from './FilePreview';
import type { AssignmentDTO, AssignmentResponseDTO } from '../types';

interface TeacherResponsesViewProps {
  assignment: AssignmentDTO;
  courseId: number;
}

export default function TeacherResponsesView({ assignment, courseId }: TeacherResponsesViewProps) {
  const [responses, setResponses] = useState<AssignmentResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResponses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const initialResponses = await getAssignmentResponses(courseId, assignment.id);
      
      const detailedResponses = await Promise.all(
        initialResponses.responses.map(response => 
          getAssignmentResponse(courseId, assignment.id, response.id)
        )
      );

      setResponses(detailedResponses);
    } catch (err) {
      console.error('Error loading responses:', err);
      setError('Не вдалося завантажити відповіді.');
    } finally {
      setLoading(false);
    }
  }, [assignment, courseId]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  const handleGrade = async (responseId: number) => {
    const grade = prompt('Enter grade:');
    const gradeComment = prompt('Enter grade comment:');
    if (grade) {
      try {
        await gradeAssignmentResponse(courseId, assignment.id, responseId, { grade: parseInt(grade), gradeComment: gradeComment || '' });
        await loadResponses();
      } catch (err) {
        console.error('Error grading response:', err);
        setError(err instanceof Error ? err.message : 'Не вдалося оцінити відповідь');
      }
    }
  };

  const handleReturn = async (responseId: number) => {
    const returnComment = prompt('Enter return comment:');
    if (returnComment) {
      try {
        await returnAssignmentResponse(courseId, assignment.id, responseId, { returnComment });
        await loadResponses();
      } catch (err) {
        console.error('Error returning response:', err);
        setError(err instanceof Error ? err.message : 'Не вдалося повернути відповідь');
      }
    }
  };

  const handleCancelGrade = async (responseId: number) => {
    if (window.confirm('Are you sure you want to cancel the grade for this response?')) {
      try {
        await cancelGrade(courseId, assignment.id, responseId);
        await loadResponses();
      } catch (err) {
        console.error('Error cancelling grade:', err);
        setError(err instanceof Error ? err.message : 'Failed to cancel grade');
      }
    }
  };

  const handleCancelReturn = async (responseId: number) => {
    if (window.confirm('Are you sure you want to cancel the return for this response?')) {
      try {
        await cancelReturn(courseId, assignment.id, responseId);
        await loadResponses();
      } catch (err) {
        console.error('Error cancelling return:', err);
        setError(err instanceof Error ? err.message : 'Failed to cancel return');
      }
    }
  };

  if (loading) {
    return <p>Завантаження відповідей...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-primary text-2xl font-montserrat mb-6">
        Відповіді на завдання: {assignment.title}
      </h2>
      <div className="space-y-4">
        {responses.length === 0 && <p>Ще немає відповідей.</p>}
        {responses.map(response => (
          <div key={response.id} className="bg-gray-50 rounded-[10px] p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-primary font-semibold">{response.authorUsername}</p>
                {response.isGraded && <p className="text-green-600">Grade: {response.grade}</p>}
                {response.isReturned && <p className="text-orange-600">Returned for revision</p>}
              </div>
              <div className="flex gap-2">
                {!response.isGraded && !response.isReturned && (
                  <button
                    onClick={() => handleGrade(response.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                  >
                    Оцінити
                  </button>
                )}
                {!response.isGraded && (
                  <button
                    onClick={() => handleReturn(response.id)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                  >
                    Повернути
                  </button>
                )}
                {response.isGraded && (
                  <button
                    onClick={() => handleCancelGrade(response.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                  >
                    Скасувати оцінку
                  </button>
                )}
                {response.isReturned && (
                  <button
                    onClick={() => handleCancelReturn(response.id)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                  >
                    Скасувати повернення
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-primary font-montserrat font-semibold mb-3">
                Здані файли ({response.media?.length || 0}):
              </h3>
              {response.media && response.media.length > 0 ? (
                <div className="space-y-2">
                  {response.media.map((media) => (
                    <FilePreview
                      key={media.id}
                      fileName={media.name || 'Файл'}
                      fileUrl={media.fileUrl || ''}
                      showThumbnail={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 font-montserrat">Немає прикріплених файлів.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
