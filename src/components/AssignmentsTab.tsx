import { useState, useEffect } from 'react';
import { getCourseAssignments, createAssignment, deleteAssignment, submitAssignmentResponse, getAssignmentResponses, getAssignmentResponse } from '../api/courses';
import { FileUpload, type UploadedFile } from './FileUpload';
import { FilePreview } from './FilePreview';
import { getUsernameFromToken } from '../services/auth';
import type { AssignmentDTO, CreateAssignmentRequest, CreateAssignmentResponseRequest, AssignmentResponseDTO } from '../types';

interface AssignmentsTabProps {
  courseId: number;
  isOpen: boolean;
}

export default function AssignmentsTab({ courseId, isOpen }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDTO | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Store responses for each assignment (assignmentId -> user's response)
  const [userResponses, setUserResponses] = useState<Map<number, AssignmentResponseDTO | null>>(new Map());
  
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentRequest>({
    title: '',
    description: '',
    maxGrade: 100,
    deadline: ''
  });
  
  const [newResponse, setNewResponse] = useState<CreateAssignmentResponseRequest>({
    media: []
  });

  useEffect(() => {
    loadAssignments();
  }, [courseId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseAssignments(courseId);
      setAssignments(response.assignments);
      
      // Load responses for each assignment
      const responsesMap = new Map<number, AssignmentResponseDTO | null>();
      const username = getUsernameFromToken();
      
      for (const assignment of response.assignments) {
        try {
          const responsesData = await getAssignmentResponses(courseId, assignment.id);
          console.log(`Assignment ${assignment.id} responses:`, responsesData);
          
          // Find current user's response
          const userResponseBasic = responsesData.responses.find(r => r.authorUsername === username);
          
          if (userResponseBasic) {
            // Fetch the detailed response with media using the specific response endpoint
            console.log(`Fetching detailed response ${userResponseBasic.id} for assignment ${assignment.id}`);
            const userResponseDetailed = await getAssignmentResponse(courseId, assignment.id, userResponseBasic.id);
            console.log(`User response for assignment ${assignment.id}:`, userResponseDetailed);
            console.log(`User response media:`, userResponseDetailed.media);
            responsesMap.set(assignment.id, userResponseDetailed);
          } else {
            responsesMap.set(assignment.id, null);
          }
        } catch (err) {
          console.error(`Error loading responses for assignment ${assignment.id}:`, err);
          responsesMap.set(assignment.id, null);
        }
      }
      
      setUserResponses(responsesMap);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Не вдалося завантажити завдання');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAssignment.title.trim()) {
      setError('Назва завдання є обов\'язковою');
      return;
    }

    if (!newAssignment.deadline) {
      setError('Термін здачі є обов\'язковим');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      
      await createAssignment(courseId, {
        ...newAssignment,
        // Ensure deadline is in ISO format
        deadline: new Date(newAssignment.deadline).toISOString()
      });
      
      // Reset form and close modal
      setNewAssignment({
        title: '',
        description: '',
        maxGrade: 100,
        deadline: ''
      });
      setShowCreateModal(false);
      
      // Reload assignments
      await loadAssignments();
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося створити завдання');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Ви впевнені, що хочете видалити це завдання?')) {
      return;
    }

    try {
      await deleteAssignment(courseId, assignmentId);
      await loadAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося видалити завдання');
    }
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    setNewResponse({
      media: files
    });
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment) return;

    if (newResponse.media.length === 0) {
      setError('Додайте хоча б один файл');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      
      console.log('Submitting response with data:', newResponse);
      console.log('Media files:', newResponse.media);
      
      const result = await submitAssignmentResponse(courseId, selectedAssignment.id, newResponse);
      console.log('Submit response result:', result);
      
      // Reset form and close modal
      setNewResponse({ media: [] });
      setShowSubmitModal(false);
      setSelectedAssignment(null);
      
      // Reload assignments to update response status
      await loadAssignments();
      
      alert('Відповідь успішно надіслано!');
    } catch (err) {
      console.error('Error submitting response:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати відповідь');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseStatus = (assignmentId: number) => {
    const response = userResponses.get(assignmentId);
    
    if (!response) {
      return {
        status: 'not_submitted',
        label: 'Не здано',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        response: null
      };
    }
    
    if (response.isReturned) {
      return {
        status: 'returned',
        label: 'Повернено на доопрацювання',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        response
      };
    }
    
    if (response.isGraded) {
      return {
        status: 'graded',
        label: `Оцінено: ${response.grade} балів`,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        response
      };
    }
    
    return {
      status: 'submitted',
      label: 'Здано, очікує перевірки',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      response
    };
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary text-xl font-montserrat">Завантаження завдань...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-primary text-2xl font-montserrat">Завдання</h2>
        
        {isOpen && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
          >
            Додати завдання
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-[10px] font-montserrat">
          {error}
        </div>
      )}

      {/* Assignments list */}
      {assignments.length === 0 ? (
        <div className="text-center text-gray-500 font-montserrat py-12">
          <p className="text-xl">Ще немає завдань</p>
          {isOpen && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
            >
              Додати перше завдання
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const deadlinePassed = isDeadlinePassed(assignment.deadline);
            const responseStatus = getResponseStatus(assignment.id);
            
            return (
              <div
                key={assignment.id}
                className={`bg-white rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                  deadlinePassed ? 'border-l-4 border-red-500' : 'border-l-4 border-primary'
                }`}
              >
                {/* Assignment header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-primary text-xl font-montserrat">
                        {assignment.title}
                      </h3>
                      
                      {/* Response status badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-montserrat ${responseStatus.bgColor} ${responseStatus.color}`}>
                        {responseStatus.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-montserrat">
                      <span>{assignment.authorUsername}</span>
                      <span>•</span>
                      <span>Макс. бал: {assignment.maxGrade}</span>
                      <span>•</span>
                      <span className={deadlinePassed ? 'text-red-500' : 'text-green-600'}>
                        {deadlinePassed ? 'Термін минув' : 'До здачі'}: {formatDeadline(assignment.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {responseStatus.response ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowResponseModal(true);
                          }}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                        >
                          Переглянути відповідь
                        </button>
                        
                        {/* Show re-submit button only if returned for revision */}
                        {responseStatus.response.isReturned && (
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowSubmitModal(true);
                            }}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                            title="Здати повторно"
                          >
                            Здати повторно
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowSubmitModal(true);
                        }}
                        className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
                      >
                        Здати
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Видалити завдання"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Description */}
                {assignment.description && (
                  <div className="mb-4">
                    <p className="text-gray-700 font-montserrat whitespace-pre-wrap">
                      {assignment.description}
                    </p>
                  </div>
                )}

                {/* Media files */}
                {assignment.media && assignment.media.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-600 font-montserrat text-sm font-medium mb-2">
                      Прикріплені файли ({assignment.media.length}):
                    </p>
                    {assignment.media.map((media) => (
                      <FilePreview
                        key={media.id}
                        fileName={media.name || 'Файл'}
                        fileUrl={media.fileUrl || ''}
                        showThumbnail={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-primary text-2xl font-montserrat mb-6">
              Створити нове завдання
            </h2>
            
            <form onSubmit={handleCreateAssignment}>
              {/* Title */}
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">
                  Назва завдання *
                </label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Введіть назву завдання"
                  required
                  className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">
                  Опис
                </label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Введіть опис завдання"
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200 resize-none"
                />
              </div>

              {/* Max Grade */}
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">
                  Максимальний бал *
                </label>
                <input
                  type="number"
                  value={newAssignment.maxGrade}
                  onChange={(e) => setNewAssignment({ ...newAssignment, maxGrade: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                  min="0"
                  required
                  className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                />
              </div>

              {/* Deadline */}
              <div className="mb-6">
                <label className="block text-primary text-lg font-montserrat mb-2">
                  Термін здачі *
                </label>
                <input
                  type="datetime-local"
                  value={newAssignment.deadline}
                  onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                  required
                  className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAssignment({
                      title: '',
                      description: '',
                      maxGrade: 100,
                      deadline: ''
                    });
                    setError(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-primary rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                >
                  Скасувати
                </button>
                
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-6 py-3 bg-accent hover:bg-secondary disabled:opacity-50 text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                >
                  {createLoading ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Response Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-primary text-2xl font-montserrat mb-2">
              Здати завдання
            </h2>
            <p className="text-gray-600 font-montserrat mb-6">
              {selectedAssignment.title}
            </p>
            
            <form onSubmit={handleSubmitResponse}>
              {/* Media */}
              <div className="mb-6">
                <FileUpload
                  purpose="assignment-response-file"
                  generateUniqueFileName={(file, index) => {
                    const extension = file.name.split('.').pop() || '';
                    const timestamp = Date.now();
                    const assignmentId = selectedAssignment?.id || 0;
                    return `assignment_${assignmentId}_response_${timestamp}_${index}.${extension}`;
                  }}
                  onFilesChange={handleFilesChange}
                  currentFiles={newResponse.media}
                  maxSizeMB={50}
                  maxFiles={10}
                  label="Прикріплені файли *"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSelectedAssignment(null);
                    setNewResponse({ media: [] });
                    setError(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-primary rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                >
                  Скасувати
                </button>
                
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-6 py-3 bg-accent hover:bg-secondary disabled:opacity-50 text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                >
                  {submitLoading ? 'Надсилання...' : 'Здати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Response Modal */}
      {showResponseModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const responseStatus = getResponseStatus(selectedAssignment.id);
              const response = responseStatus.response;
              
              if (!response) return null;
              
              return (
                <>
                  <div className="mb-6">
                    <h2 className="text-primary text-2xl font-montserrat mb-2">
                      Ваша відповідь
                    </h2>
                    <p className="text-gray-600 font-montserrat mb-3">
                      {selectedAssignment.title}
                    </p>
                    
                    {/* Status Badge */}
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-montserrat ${responseStatus.bgColor} ${responseStatus.color}`}>
                      {responseStatus.label}
                    </span>
                  </div>

                  {/* Grade Information */}
                  {response.isGraded && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-[10px]">
                      <h3 className="text-green-700 font-montserrat font-semibold mb-2">
                        Оцінка: {response.grade} / {selectedAssignment.maxGrade} балів
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

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowResponseModal(false);
                      setSelectedAssignment(null);
                    }}
                    className="w-full px-6 py-3 bg-primary hover:bg-secondary text-white rounded-[10px] font-montserrat text-lg transition-colors duration-200"
                  >
                    Закрити
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

