import { useState, useEffect } from 'react';
import { getAssignmentResponse } from '../api/courses';
import { FilePreview } from './FilePreview';
import type { AssignmentDTO, AssignmentResponseDTO } from '../types';

interface StudentResponseViewProps {
  assignment: AssignmentDTO;
  response: AssignmentResponseDTO | null;
  courseId: number;
  onUpdate?: () => void;
}

export default function StudentResponseView({ assignment, response: initialResponse, courseId, onUpdate }: StudentResponseViewProps) {
  const [response, setResponse] = useState<AssignmentResponseDTO | null>(initialResponse);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponse = async () => {
      if (!initialResponse) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fullResponse = await getAssignmentResponse(courseId, assignment.id, initialResponse.id);
        setResponse(fullResponse);
        setError(null);
      } catch (err) {
        console.error("Error fetching full response:", err);
        setError("Не вдалося завантажити повну відповідь.");
      } finally {
        setLoading(false);
      }
    };

    fetchResponse();
  }, [courseId, assignment.id, initialResponse, onUpdate]);

  if (loading) {
    return <p>Завантаження відповіді...</p>;
  }
  
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!response) {
    return <p>Ви ще не здали цю роботу.</p>;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-primary text-2xl font-montserrat mb-2">
          Ваша відповідь
        </h2>
        <p className="text-gray-600 font-montserrat mb-3">
          {assignment.title}
        </p>
      </div>

      {/* Grade Information */}
      {response.isGraded && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-[10px]">
          <h3 className="text-green-700 font-montserrat font-semibold mb-2">
            Оцінка: {response.grade} / {assignment.maxGrade} балів
          </h3>
          {response.gradeComment && (
            <p className="text-gray-700 font-montserrat whitespace-pre-wrap">
              {response.gradeComment}
            </p>
          )}
        </div>
      )}

      {/* Return Information */}
      {response.isReturned && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-[10px]">
          <h3 className="text-orange-700 font-montserrat font-semibold mb-2">
            Повернено на доопрацювання
          </h3>
          {response.returnComment && (
            <p className="text-gray-700 font-montserrat whitespace-pre-wrap">
              {response.returnComment}
            </p>
          )}
        </div>
      )}

      {/* Submitted Files */}
      <div className="mb-6">
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
              <strong>⚠️ Помилка бекенду:</strong> Файли були надіслані, але бекенд не повертає їх у відповіді. 
              Це відома проблема на стороні сервера. Файли збережено, але наразі їх неможливо переглянути.
            </p>
            <p className="text-yellow-600 font-montserrat text-xs mt-2">
              ID відповіді: {response.id} • Автор: {response.authorUsername}
            </p>
          </div>
        )}
      </div>

      {/* Resubmit Button */}
      {!response.isGraded && onUpdate && (
        <button
          onClick={onUpdate}
          className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200"
        >
          Здати повторно
        </button>
      )}
    </>
  );
}