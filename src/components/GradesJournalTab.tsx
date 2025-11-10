import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCourseAssignments, getAssignmentResponses } from '../api/courses';
import type { AssignmentDTO, AssignmentResponseDTO, CourseMember } from '../types';

interface GradesJournalTabProps {
    courseId: number;
    members: CourseMember[];
}

interface GradeCell {
    studentUsername: string;
    assignmentId: number;
    response?: AssignmentResponseDTO;
}

export default function GradesJournalTab({ courseId, members }: GradesJournalTabProps) {
    const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
    const [gradesMatrix, setGradesMatrix] = useState<Map<string, GradeCell>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter only students - memoize to prevent infinite loops
    const students = useMemo(() => members.filter(m => m.role === 'STUDENT'), [members]);

    const loadGradesData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Load assignments
            const assignmentsResponse = await getCourseAssignments(courseId);
            const assignmentsList = assignmentsResponse.assignments;
            setAssignments(assignmentsList);

            // Load responses for each assignment
            const matrix = new Map<string, GradeCell>();

            for (const assignment of assignmentsList) {
                try {
                    const responsesResponse = await getAssignmentResponses(courseId, assignment.id);
                    const responses = responsesResponse.responses;

                    // Map responses by username
                    const responsesByUsername = new Map<string, AssignmentResponseDTO>();
                    responses.forEach(response => {
                        responsesByUsername.set(response.authorUsername, response);
                    });

                    // Create grade cells for all students
                    students.forEach(student => {
                        const key = `${student.username}-${assignment.id}`;
                        const response = responsesByUsername.get(student.username);

                        matrix.set(key, {
                            studentUsername: student.username,
                            assignmentId: assignment.id,
                            response
                        });
                    });
                } catch (err) {
                    console.error(`Error loading responses for assignment ${assignment.id}:`, err);
                }
            }

            setGradesMatrix(matrix);
        } catch (err) {
            console.error('Error loading grades data:', err);
            setError('Не вдалося завантажити дані журналу');
        } finally {
            setLoading(false);
        }
    }, [courseId, students]);

    useEffect(() => {
        loadGradesData();
    }, [loadGradesData]);

    const getGradeCell = (studentUsername: string, assignmentId: number): GradeCell | undefined => {
        return gradesMatrix.get(`${studentUsername}-${assignmentId}`);
    };

    const getGradeCellStyle = (cell?: GradeCell) => {
        if (!cell?.response) {
            return 'bg-gray-50 text-gray-400';
        }
        if (cell.response.isReturned) {
            return 'bg-orange-50 text-orange-600';
        }
        if (cell.response.isGraded) {
            return 'bg-green-50 text-green-700 font-semibold';
        }
        return 'bg-blue-50 text-blue-600';
    };

    const getGradeCellContent = (cell?: GradeCell) => {
        if (!cell?.response) {
            return '—';
        }
        if (cell.response.isGraded && cell.response.grade !== undefined && cell.response.grade !== null) {
            return cell.response.grade;
        }
        if (cell.response.isReturned) {
            return '↩';
        }
        return '✓';
    };

    const calculateStudentAverage = (studentUsername: string): number | null => {
        const studentGrades: number[] = [];

        assignments.forEach(assignment => {
            const cell = getGradeCell(studentUsername, assignment.id);
            if (cell?.response?.isGraded && cell.response.grade !== undefined && cell.response.grade !== null) {
                studentGrades.push(cell.response.grade);
            }
        });

        if (studentGrades.length === 0) return null;
        return Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length);
    };

    const calculateAssignmentAverage = (assignmentId: number): number | null => {
        const assignmentGrades: number[] = [];

        students.forEach(student => {
            const cell = getGradeCell(student.username, assignmentId);
            if (cell?.response?.isGraded && cell.response.grade !== undefined && cell.response.grade !== null) {
                assignmentGrades.push(cell.response.grade);
            }
        });

        if (assignmentGrades.length === 0) return null;
        return Math.round(assignmentGrades.reduce((a, b) => a + b, 0) / assignmentGrades.length);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-primary text-xl font-montserrat">Завантаження журналу...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500 text-xl font-montserrat">{error}</p>
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 text-xl font-montserrat mb-2">
                    Журнал оцінок порожній
                </p>
                <p className="text-gray-400 text-sm font-montserrat">
                    Створіть завдання, щоб побачити оцінки студентів
                </p>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 text-xl font-montserrat mb-2">
                    Немає студентів у курсі
                </p>
                <p className="text-gray-400 text-sm font-montserrat">
                    Додайте студентів до курсу
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-primary text-2xl font-montserrat">
                    Журнал оцінок
                </h2>
                <div className="flex gap-2 text-xs sm:text-sm font-montserrat">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                        <span className="text-gray-600">Оцінено</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                        <span className="text-gray-600">Здано</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
                        <span className="text-gray-600">Повернено</span>
                    </div>
                </div>
            </div>

            {/* Scrollable container */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 sticky top-0 z-10">
                            <th className="border border-gray-300 px-4 py-3 text-left font-montserrat text-sm font-semibold text-primary sticky left-0 bg-gray-100 min-w-[150px]">
                                Студент
                            </th>
                            {assignments.map((assignment) => (
                                <th
                                    key={assignment.id}
                                    className="border border-gray-300 px-3 py-3 text-center font-montserrat text-xs sm:text-sm font-semibold text-primary min-w-[100px]"
                                    title={assignment.title}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="truncate max-w-[120px]">
                                            {assignment.title.length > 15 ? `${assignment.title.substring(0, 15)}...` : assignment.title}
                                        </span>
                                        <span className="text-xs text-gray-500 font-normal">
                                            max: {assignment.maxGrade}
                                        </span>
                                    </div>
                                </th>
                            ))}
                            <th className="border border-gray-300 px-4 py-3 text-center font-montserrat text-sm font-semibold text-primary sticky right-0 bg-gray-100 min-w-[80px]">
                                Середнє
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student.username} className="hover:bg-gray-50 transition-colors">
                                <td className="border border-gray-300 px-4 py-3 font-montserrat text-sm sticky left-0 bg-white">
                                    {student.username}
                                </td>
                                {assignments.map((assignment) => {
                                    const cell = getGradeCell(student.username, assignment.id);
                                    return (
                                        <td
                                            key={`${student.username}-${assignment.id}`}
                                            className={`border border-gray-300 px-3 py-3 text-center font-montserrat text-sm ${getGradeCellStyle(cell)}`}
                                        >
                                            {getGradeCellContent(cell)}
                                        </td>
                                    );
                                })}
                                <td className="border border-gray-300 px-4 py-3 text-center font-montserrat text-sm font-semibold sticky right-0 bg-white">
                                    {calculateStudentAverage(student.username) ?? '—'}
                                </td>
                            </tr>
                        ))}
                        {/* Average row */}
                        <tr className="bg-gray-50 font-semibold">
                            <td className="border border-gray-300 px-4 py-3 font-montserrat text-sm sticky left-0 bg-gray-50">
                                Середнє по завданню
                            </td>
                            {assignments.map((assignment) => (
                                <td
                                    key={`avg-${assignment.id}`}
                                    className="border border-gray-300 px-3 py-3 text-center font-montserrat text-sm bg-gray-50"
                                >
                                    {calculateAssignmentAverage(assignment.id) ?? '—'}
                                </td>
                            ))}
                            <td className="border border-gray-300 px-4 py-3 sticky right-0 bg-gray-50"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-gray-600 text-sm font-montserrat mb-1">Студентів</p>
                    <p className="text-primary text-2xl font-bold">{students.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-gray-600 text-sm font-montserrat mb-1">Завдань</p>
                    <p className="text-primary text-2xl font-bold">{assignments.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-gray-600 text-sm font-montserrat mb-1">Всього оцінок</p>
                    <p className="text-primary text-2xl font-bold">
                        {Array.from(gradesMatrix.values()).filter(cell => cell.response?.isGraded).length}
                    </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-gray-600 text-sm font-montserrat mb-1">На перевірці</p>
                    <p className="text-primary text-2xl font-bold">
                        {Array.from(gradesMatrix.values()).filter(cell => cell.response && !cell.response.isGraded && !cell.response.isReturned).length}
                    </p>
                </div>
            </div>
        </div>
    );
}
