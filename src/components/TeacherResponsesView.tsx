import { useState, useEffect } from 'react';
import { getAssignmentResponses, gradeAssignmentResponse, returnAssignmentResponse } from '../api/courses';
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

  useEffect(() => {
    const loadResponses = async () => {
      try {
        setLoading(true);
        setError(null);
        const responsesData = await getAssignmentResponses(courseId, assignment.id);
        setResponses(responsesData.responses);
      } catch (err) {
        console.error('Error loading responses:', err);
        setError('Не вдалося завантажити відповіді.');
      } finally {
        setLoading(false);
      }
    };
    loadResponses();
  }, [assignment, courseId]);

  const handleGrade = async (responseId: number) => {
    const grade = prompt('Enter grade:');
    const gradeComment = prompt('Enter grade comment:');
    if (grade) {
      try {
        await gradeAssignmentResponse(courseId, assignment.id, responseId, { grade: parseInt(grade), gradeComment: gradeComment || '' });
        // Refresh responses
        const responsesData = await getAssignmentResponses(courseId, assignment.id);
        setResponses(responsesData.responses);
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
        // Refresh responses
        const responsesData = await getAssignmentResponses(courseId, assignment.id);
        setResponses(responsesData.responses);
      } catch (err) {
        console.error('Error returning response:', err);
        setError(err instanceof Error ? err.message : 'Не вдалося повернути відповідь');
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
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGrade(response.id)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                >
                  Оцінити
                </button>
                <button
                  onClick={() => handleReturn(response.id)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                >
                  Повернути
                </button>
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
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-[10px]">
                  <p className="text-yellow-700 font-montserrat text-sm">
                    <strong>⚠️ Помилка бекенду:</strong> Файли неможливо переглянути.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
