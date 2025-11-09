import { useState, useEffect } from 'react';
import type { RelatedEntity, AssignmentDTO, MaterialDTO } from '../../../types';
import { getAssignment, getMaterial } from '../../../api/courses';

interface RelatedEntityCardProps {
  entity: RelatedEntity;
  courseId: number;
}

export default function RelatedEntityCard({ entity, courseId }: RelatedEntityCardProps) {
    const [data, setData] = useState<AssignmentDTO | MaterialDTO | null>(null);
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

    return (
        <div className="p-3 border rounded-lg my-2 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <h4 className="font-bold text-sm text-primary">
                {isAssignment(data) ? 'Assignment' : 'Material'}
            </h4>
            <p className="text-gray-800">
                {isAssignment(data) ? data.title : data.topic}
            </p>
            {/* TODO: Add a "View" button that navigates to the entity page */}
        </div>
    );
}