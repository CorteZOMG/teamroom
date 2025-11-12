import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RelatedEntity, AssignmentDTO, MaterialDTO, Conference } from '../../../types';
import { getAssignment, getMaterial } from '../../../api/courses';
import { getConferences } from '../../../api/conferences';

interface RelatedEntityCardProps {
  entity: RelatedEntity;
  courseId: number;
}

export default function RelatedEntityCard({ entity, courseId }: RelatedEntityCardProps) {
    const navigate = useNavigate();
    const [data, setData] = useState<AssignmentDTO | MaterialDTO | Conference | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                let result;
                if (entity.relatedEntityType === 'ASSIGNMENT') {
                    result = await getAssignment(courseId, entity.relatedEntityId);
                } else if (entity.relatedEntityType === 'MATERIAL') {
                    result = await getMaterial(courseId, entity.relatedEntityId);
                } else if (entity.relatedEntityType === 'CONFERENCE') {
                    const conferences = await getConferences(courseId);
                    result = conferences.find(c => c.id === entity.relatedEntityId);
                }
                setData(result || null);
            } catch (err) {
                setError('Failed to load entity details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [entity, courseId]);

    if (loading) {
        return <div className="p-2 border rounded-lg my-2 bg-gray-100 animate-pulse h-16"></div>;
    }

    if (error) {
        return <div className="p-3 border rounded-lg my-2 bg-red-100 text-red-700 text-sm">{error}</div>;
    }

    if (!data) {
        return null;
    }

    const isAssignment = (d: any): d is AssignmentDTO => d.title !== undefined;
    const isConference = (d: any): d is Conference => d.subject !== undefined && d.status !== undefined;

    const handleNavigate = () => {
        // Navigate to the course page with the appropriate tab
        if (entity.relatedEntityType === 'ASSIGNMENT') {
            navigate(`/courses/${courseId}?tab=assignments&focusId=${entity.relatedEntityId}`);
        } else if (entity.relatedEntityType === 'MATERIAL') {
            navigate(`/courses/${courseId}?tab=materials&focusId=${entity.relatedEntityId}`);
        } else if (entity.relatedEntityType === 'CONFERENCE') {
            navigate(`/courses/${courseId}?tab=conference&focusId=${entity.relatedEntityId}`);
        }
    };

    const getConferenceStatusColor = () => {
        if (!isConference(data)) return 'from-blue-50 to-blue-100 border-blue-300 hover:from-blue-100 hover:to-blue-200';
        return data.status === 'ACTIVE' 
            ? 'from-green-50 to-green-100 border-green-300 hover:from-green-100 hover:to-green-200'
            : 'from-gray-50 to-gray-100 border-gray-300 hover:from-gray-100 hover:to-gray-200';
    };

    const getConferenceStatusLabel = () => {
        if (!isConference(data)) return '';
        return data.status === 'ACTIVE' ? '🟢 Active' : '🔴 Ended';
    };

    return (
        <div
            onClick={handleNavigate}
            className={`p-3 border rounded-lg my-2 bg-gradient-to-r ${getConferenceStatusColor()} transition-colors cursor-pointer shadow-sm hover:shadow-md`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h4 className="font-bold text-sm" style={{color: isConference(data) && data.status === 'ACTIVE' ? '#047857' : isConference(data) ? '#6b7280' : '#1e40af'}}>
                        {entity.relatedEntityType === 'ASSIGNMENT' && '📝 Assignment'}
                        {entity.relatedEntityType === 'MATERIAL' && '📚 Material'}
                        {entity.relatedEntityType === 'CONFERENCE' && '🎥 Conference'}
                    </h4>
                    <p className="text-gray-800 text-sm mt-1">
                        {isAssignment(data) ? data.title : isConference(data) ? data.subject : data.topic}
                    </p>
                    {isConference(data) && (
                        <p className="text-gray-600 text-xs mt-1">
                            {getConferenceStatusLabel()}
                        </p>
                    )}
                </div>
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color: isConference(data) && data.status === 'ACTIVE' ? '#059669' : isConference(data) ? '#9ca3af' : '#2563eb'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
}