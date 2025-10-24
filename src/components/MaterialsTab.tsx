import { useState, useEffect } from 'react';
import { getCourseMaterials, createMaterial, deleteMaterial } from '../api/courses';
import { FileUpload, type UploadedFile } from './FileUpload';
import type { MaterialDTO, CreateMaterialRequest } from '../types';

interface MaterialsTabProps {
  courseId: number;
  isOpen: boolean;
}

export default function MaterialsTab({ courseId, isOpen }: MaterialsTabProps) {
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [expandedMaterial, setExpandedMaterial] = useState<number | null>(null);
  
  const [newMaterial, setNewMaterial] = useState<CreateMaterialRequest>({
    topic: '',
    textContent: '',
    tags: [],
    media: []
  });
  
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseMaterials(courseId);
      setMaterials(response.materials);
    } catch (err) {
      console.error('Error loading materials:', err);
      setError('Не вдалося завантажити матеріали');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newMaterial.tags.some(t => t.name === newTag.trim())) {
      setNewMaterial({
        ...newMaterial,
        tags: [...newMaterial.tags, { name: newTag.trim() }]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setNewMaterial({
      ...newMaterial,
      tags: newMaterial.tags.filter(t => t.name !== tagName)
    });
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    setNewMaterial({
      ...newMaterial,
      media: files
    });
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMaterial.topic.trim()) {
      setError('Тема є обов\'язковою');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      
      await createMaterial(courseId, newMaterial);
      
      // Reset form and close modal
      setNewMaterial({
        topic: '',
        textContent: '',
        tags: [],
        media: []
      });
      setShowCreateModal(false);
      
      // Reload materials
      await loadMaterials();
    } catch (err) {
      console.error('Error creating material:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося створити матеріал');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей матеріал?')) {
      return;
    }

    try {
      await deleteMaterial(courseId, materialId);
      await loadMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося видалити матеріал');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary text-xl font-montserrat">Завантаження матеріалів...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-primary text-2xl font-montserrat">Матеріали</h2>
        
        {isOpen && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
          >
            Додати матеріал
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-[10px] font-montserrat">
          {error}
        </div>
      )}

      {/* Materials list */}
      {materials.length === 0 ? (
        <div className="text-center text-gray-500 font-montserrat py-12">
          <p className="text-xl">Ще немає матеріалів</p>
          {isOpen && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-primary hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
            >
              Додати перший матеріал
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Material header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-primary text-xl font-montserrat mb-2">
                    {material.topic}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 font-montserrat">
                    <span>{material.authorUsername}</span>
                    <span>•</span>
                    <span>{new Date(material.createdAt).toLocaleDateString('uk-UA')}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMaterial(material.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Видалити матеріал"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Tags */}
              {material.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {material.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-montserrat"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Text content */}
              {material.textContent && (
                <div className="mb-4">
                  <button
                    onClick={() => setExpandedMaterial(expandedMaterial === material.id ? null : material.id)}
                    className="text-primary hover:text-secondary transition-colors font-montserrat text-sm mb-2"
                  >
                    {expandedMaterial === material.id ? 'Сховати опис' : 'Показати опис'}
                  </button>
                  
                  {expandedMaterial === material.id && (
                    <p className="text-gray-700 font-montserrat whitespace-pre-wrap">
                      {material.textContent}
                    </p>
                  )}
                </div>
              )}

              {/* Media files */}
              {material.media.length > 0 && (
                <div className="space-y-2">
                  <p className="text-gray-600 font-montserrat text-sm font-medium">
                    Прикріплені файли:
                  </p>
                  {material.media.map((media) => (
                    <a
                      key={media.id}
                      href={media.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-secondary transition-colors font-montserrat"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>{media.name || 'Файл'}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Material Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-primary text-2xl font-montserrat mb-6">
              Створити новий матеріал
            </h2>
            
            <form onSubmit={handleCreateMaterial}>
              {/* Topic */}
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">
                  Тема *
                </label>
                <input
                  type="text"
                  value={newMaterial.topic}
                  onChange={(e) => setNewMaterial({ ...newMaterial, topic: e.target.value })}
                  placeholder="Введіть тему матеріалу"
                  required
                  className="w-full h-14 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200"
                />
              </div>

              {/* Text content */}
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">
                  Опис
                </label>
                <textarea
                  value={newMaterial.textContent}
                  onChange={(e) => setNewMaterial({ ...newMaterial, textContent: e.target.value })}
                  placeholder="Введіть опис матеріалу"
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary text-lg font-montserrat transition-colors duration-200 resize-none"
                />
              </div>

              {/* Tags */}
              <div className="mb-4">
                <label className="block text-primary text-lg font-montserrat mb-2">
                  Мітки
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Додати мітку"
                    className="flex-1 h-12 px-4 bg-gray-50 rounded-[10px] border-2 border-gray-200 focus:border-primary outline-none text-primary font-montserrat transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 bg-primary hover:bg-secondary text-white rounded-[10px] font-montserrat transition-colors duration-200"
                  >
                    Додати
                  </button>
                </div>
                
                {newMaterial.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newMaterial.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-montserrat flex items-center gap-2"
                      >
                        #{tag.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Media Files */}
              <div className="mb-6">
                <FileUpload
                  purpose="material-file"
                  generateUniqueFileName={(file, index) => {
                    const extension = file.name.split('.').pop() || '';
                    const timestamp = Date.now();
                    return `${file.name.replace(/\.[^/.]+$/, '')}_file_material_${timestamp}_${index}.${extension}`;
                  }}
                  onFilesChange={handleFilesChange}
                  currentFiles={newMaterial.media}
                  maxSizeMB={50}
                  maxFiles={20}
                  label="Файли матеріалу"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewMaterial({
                      topic: '',
                      textContent: '',
                      tags: [],
                      media: []
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
    </div>
  );
}


