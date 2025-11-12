import { useState, useEffect } from 'react';
import type { RelatedEntity, RelatedEntityType, AssignmentDTO, MaterialDTO } from '../../../types';
import { getCourseAssignments, getCourseMaterials } from '../../../api/courses';

interface AttachCourseContentModalProps {
  isOpen: boolean;
  courseId?: number;
  onClose: () => void;
  onAttach: (entities: RelatedEntity[]) => void;
}

export default function AttachCourseContentModal({
  isOpen,
  courseId,
  onClose,
  onAttach,
}: AttachCourseContentModalProps) {
  const [activeTab, setActiveTab] = useState<'ASSIGNMENT' | 'MATERIAL'>('ASSIGNMENT');
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<RelatedEntity[]>([]);

  useEffect(() => {
    if (isOpen && courseId) {
      loadContent();
    }
  }, [isOpen, courseId]);

  const loadContent = async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);
    try {
      const [assignmentsRes, materialsRes] = await Promise.all([
        getCourseAssignments(courseId),
        getCourseMaterials(courseId),
      ]);
      const assignmentsData = assignmentsRes.assignments;
      const materialsData = materialsRes.materials;
      setAssignments(assignmentsData);
      setMaterials(materialsData);
    } catch (err) {
      setError('Failed to load course content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEntity = (entityType: RelatedEntityType, entityId: number) => {
    setSelectedEntities((prev) => {
      const exists = prev.some(
        (e) => e.relatedEntityType === entityType && e.relatedEntityId === entityId
      );
      
      if (exists) {
        return prev.filter(
          (e) => !(e.relatedEntityType === entityType && e.relatedEntityId === entityId)
        );
      } else {
        return [...prev, { relatedEntityType: entityType, relatedEntityId: entityId }];
      }
    });
  };

  const handleAttach = () => {
    onAttach(selectedEntities);
    setSelectedEntities([]);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 font-montserrat">
            Attach Course Content
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ASSIGNMENT')}
            className={`flex-1 py-3 font-montserrat transition-colors ${
              activeTab === 'ASSIGNMENT'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('MATERIAL')}
            className={`flex-1 py-3 font-montserrat transition-colors ${
              activeTab === 'MATERIAL'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Materials
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading content...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : activeTab === 'ASSIGNMENT' ? (
            <div className="space-y-2">
              {assignments.length === 0 ? (
                <p className="text-gray-500">No assignments available</p>
              ) : (
                assignments.map((assignment) => (
                  <label
                    key={assignment.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEntities.some(
                        (e) => e.relatedEntityType === 'ASSIGNMENT' && e.relatedEntityId === assignment.id
                      )}
                      onChange={() => toggleEntity('ASSIGNMENT', assignment.id)}
                      className="w-4 h-4 text-primary rounded cursor-pointer"
                    />
                    <span className="ml-3 flex-1 font-montserrat">
                      {assignment.title}
                    </span>
                  </label>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {materials.length === 0 ? (
                <p className="text-gray-500">No materials available</p>
              ) : (
                materials.map((material) => (
                  <label
                    key={material.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEntities.some(
                        (e) => e.relatedEntityType === 'MATERIAL' && e.relatedEntityId === material.id
                      )}
                      onChange={() => toggleEntity('MATERIAL', material.id)}
                      className="w-4 h-4 text-primary rounded cursor-pointer"
                    />
                    <span className="ml-3 flex-1 font-montserrat">
                      {material.topic}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-montserrat transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAttach}
            disabled={selectedEntities.length === 0}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 font-montserrat transition-colors"
          >
            Attach ({selectedEntities.length})
          </button>
        </div>
      </div>
    </div>
  );
}
