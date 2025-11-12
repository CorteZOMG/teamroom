import { useState, useEffect, useCallback } from 'react';
import { getCourseAssignments, createAssignment, deleteAssignment, submitAssignmentResponse, deleteAssignmentResponse, getMyCourseResponses, getAssignmentResponse } from '../api/courses';
import { FileUpload, type UploadedFile } from './FileUpload';
import { FilePreview } from './FilePreview';
import StudentResponseView from './StudentResponseView';
import TeacherResponsesView from './TeacherResponsesView';
import type { AssignmentDTO, CreateAssignmentRequest, CreateAssignmentResponseRequest, AssignmentResponseDTO } from '../types';

interface AssignmentsTabProps {
  courseId: number;
  isOpen: boolean;
  userRole?: string;
  focusId?: number | null;
}

export default function AssignmentsTab({ courseId, isOpen, userRole, focusId }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDTO | null>(focusId ? { id: focusId } as AssignmentDTO : null);
  const [createLoading, setCreateLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [userResponses, setUserResponses] = useState<Map<number, AssignmentResponseDTO | null>>(new Map());
  
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentRequest>({
    title: '',
    description: '',
    maxGrade: 100,
    deadline: ''
  });
  
  const [newResponse, setNewResponse] = useState<CreateAssignmentResponseRequest>({
    text: '',
    media: []
  });

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentResponse, myResponses] = await Promise.all([
        getCourseAssignments(courseId),
        userRole === 'STUDENT' ? getMyCourseResponses(courseId) : Promise.resolve({ responses: [] })
      ]);

      const assignments = assignmentResponse.assignments;
      setAssignments(assignments);

      if (userRole === 'STUDENT') {
        const responsesMap = new Map<number, any>(); // Use any for now due to API inconsistency
        for (const response of myResponses.responses) {
          responsesMap.set(response.assignmentId, response);
        }

        const detailedResponsesMap = new Map<number, AssignmentResponseDTO | null>();
        const detailPromises = assignments.map(async (assignment) => {
          const initialResponse = responsesMap.get(assignment.id);
          const responseId = initialResponse?.responseId || initialResponse?.id;

          if (responseId) {
            try {
              const detailedResponse = await getAssignmentResponse(courseId, assignment.id, responseId);
              detailedResponsesMap.set(assignment.id, detailedResponse);
            } catch (err) {
              console.error(`Error fetching details for response on assignment ${assignment.id}:`, err);
              detailedResponsesMap.set(assignment.id, initialResponse as AssignmentResponseDTO); // Fallback
            }
          } else {
            detailedResponsesMap.set(assignment.id, null);
          }
        });

        await Promise.all(detailPromises);
        setUserResponses(detailedResponsesMap);
      }

    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Не вдалося завантажити завдання');
    } finally {
      setLoading(false);
    }
  }, [courseId, userRole]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

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
        deadline: new Date(newAssignment.deadline).toISOString()
      });
      
      setNewAssignment({ title: '', description: '', maxGrade: 100, deadline: '' });
      setShowCreateModal(false);
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
    setNewResponse(prev => ({ ...prev, media: files }));
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) {
      console.error("handleSubmitResponse called with no selected assignment.");
      return;
    }

    const submissionData: CreateAssignmentResponseRequest = {
      text: newResponse.text,
      media: newResponse.media.map(m => ({
        name: m.name,
        fileUrl: m.fileUrl
      }))
    };

    if (submissionData.media.length === 0 && !submissionData.text?.trim()) {
      setError('Додайте хоча б один файл або напишіть текстову відповідь');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      
      const existingResponse = userResponses.get(selectedAssignment.id);
      if (existingResponse && existingResponse.id) {
        await deleteAssignmentResponse(courseId, selectedAssignment.id, existingResponse.id);
      }

      await submitAssignmentResponse(courseId, selectedAssignment.id, submissionData);
      
      await loadAssignments();
      
      setNewResponse({ text: '', media: [] });
      setShowSubmitModal(false);
      setSelectedAssignment(null);
      
      alert(`Відповідь успішно ${existingResponse ? 'оновлено' : 'надіслано'}!`);
    } catch (err) {
      console.error('Error submitting response:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати відповідь');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openSubmitModal = (assignment: AssignmentDTO) => {
    setSelectedAssignment(assignment);
    const responseStatus = getResponseStatus(assignment.id);
    
    if (responseStatus.response) {
      setNewResponse({
        text: '',
        media: responseStatus.response.media.map(m => ({
          name: m.name || 'file',
          fileUrl: m.fileUrl || '',
          file: null
        } as UploadedFile))
      });
    } else {
      setNewResponse({ text: '', media: [] });
    }
    
    setShowSubmitModal(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary text-xl font-montserrat">Завантаження завдань...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        {isOpen && (userRole === 'OWNER' || userRole === 'PROFESSOR') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
          >
            Додати завдання
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-[10px] font-montserrat">
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center text-gray-500 font-montserrat py-12">
          <p className="text-xl">Ще немає завдань</p>
          {isOpen && (userRole === 'OWNER' || userRole === 'PROFESSOR') && (
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
                className={`bg-white rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${deadlinePassed ? 'border-l-4 border-red-500' : 'border-l-4 border-primary'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-primary text-xl font-montserrat">
                        {assignment.title}
                      </h3>
                      {userRole === 'STUDENT' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-montserrat ${responseStatus.bgColor} ${responseStatus.color}`}>
                          {responseStatus.label}
                        </span>
                      )}
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

                  <div className="flex flex-col sm:flex-row gap-2">
                    {(userRole === 'OWNER' || userRole === 'PROFESSOR') && (
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowResponseModal(true);
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                      >
                        Переглянути відповіді
                      </button>
                    )}
                    {userRole === 'STUDENT' && (
                      responseStatus.response ? (
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
                          {!responseStatus.response.isGraded && (
                            <button
                              onClick={() => openSubmitModal(assignment)}
                              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                              title="Здати повторно"
                            >
                              Здати повторно
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => openSubmitModal(assignment)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-[10px] font-montserrat transition-colors duration-200"
                        >
                          Здати
                        </button>
                      )
                    )}
                    {(userRole === 'OWNER' || userRole === 'PROFESSOR') && (
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Видалити завдання"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {assignment.description && (
                  <div className="mb-4">
                    <p className="text-gray-700 font-montserrat whitespace-pre-wrap">
                      {assignment.description}
                    </p>
                  </div>
                )}

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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-primary text-2xl font-montserrat mb-6">
              Створити нове завдання
            </h2>
            <form onSubmit={handleCreateAssignment}>
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">Назва завдання *</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Введіть назву завдання"
                  required
                  className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                />
              </div>
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">Опис</label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Введіть опис завдання"
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200 resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">Максимальний бал *</label>
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
              <div className="mb-6">
                <label className="block text-primary text-lg font-montserrat mb-2">Термін здачі *</label>
                <input
                  type="datetime-local"
                  value={newAssignment.deadline}
                  onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                  required
                  className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAssignment({ title: '', description: '', maxGrade: 100, deadline: '' });
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

      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-primary text-2xl font-montserrat mb-2">Здати завдання</h2>
            <p className="text-gray-600 font-montserrat mb-6">{selectedAssignment.title}</p>
            <form onSubmit={handleSubmitResponse}>
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">Текстова відповідь</label>
                <textarea
                  value={newResponse.text}
                  onChange={(e) => setNewResponse(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Введіть текстову відповідь (необов'язково)"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200 resize-none"
                />
              </div>
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
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSelectedAssignment(null);
                    setNewResponse({ text: '', media: [] });
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

      {showResponseModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowResponseModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            {userRole === 'STUDENT' ? (
              <StudentResponseView
                assignment={selectedAssignment}
                response={userResponses.get(selectedAssignment.id) ?? null}
                courseId={courseId}
                onUpdate={loadAssignments}
              />
            ) : (
              <TeacherResponsesView assignment={selectedAssignment} courseId={courseId} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}