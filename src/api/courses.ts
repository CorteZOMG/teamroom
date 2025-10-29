import { apiFetch } from './client';
import type {
  Course,
  UserCoursesResponse,
  CreateCourseRequest,
  CreateCourseResponse,
  AddCourseMemberRequest,
  AddCourseMemberResponse,
  PutCourseMemberRoleRequest,
  PutCourseMemberRoleResponse,
  DeleteCourseMemberResponse,
  MaterialDTO,
  CreateMaterialRequest,
  CreateMaterialResponse,
  AssignmentDTO,
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  AssignmentResponseDTO,
  CreateAssignmentResponseRequest,
  CreateAssignmentResponseResponse,
  GradeAssignmentResponseRequest,
  ReturnAssignmentResponseRequest
} from '../types';

// ===== COURSE OPERATIONS =====

export async function getUserCourses(): Promise<UserCoursesResponse> {
  return apiFetch<UserCoursesResponse>('/api/course', {
    method: 'GET',
  });
}

export async function createCourse(data: CreateCourseRequest): Promise<CreateCourseResponse> {
  return apiFetch<CreateCourseResponse>('/api/course', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCourse(courseId: number): Promise<Course> {
  return apiFetch<Course>(`/api/course/${courseId}`, {
    method: 'GET',
  });
}

export async function updateCourse(courseId: number, data: CreateCourseRequest): Promise<{courseId: number; message: string}> {
  return apiFetch<{courseId: number; message: string}>(`/api/course/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function patchCourse(courseId: number, data: Partial<CreateCourseRequest>): Promise<{courseId: number; message: string}> {
  return apiFetch<{courseId: number; message: string}>(`/api/course/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(courseId: number): Promise<{courseId: number; message: string}> {
  return apiFetch<{courseId: number; message: string}>(`/api/course/${courseId}`, {
    method: 'DELETE',
  });
}

export async function openCourse(courseId: number): Promise<{message: string}> {
  return apiFetch<{message: string}>(`/api/course/${courseId}/open`, {
    method: 'POST',
  });
}

// ===== COURSE MEMBERS =====

export async function addCourseMember(courseId: number, data: AddCourseMemberRequest): Promise<AddCourseMemberResponse> {
  return apiFetch<AddCourseMemberResponse>(`/api/course/${courseId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changeMemberRole(courseId: number, data: PutCourseMemberRoleRequest): Promise<PutCourseMemberRoleResponse> {
  return apiFetch<PutCourseMemberRoleResponse>(`/api/course/${courseId}/members`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMember(courseId: number, username: string): Promise<DeleteCourseMemberResponse> {
  return apiFetch<DeleteCourseMemberResponse>(`/api/course/${courseId}/members?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
}

// ===== MATERIALS =====

export async function getCourseMaterials(courseId: number): Promise<{materials: MaterialDTO[]}> {
  return apiFetch<{materials: MaterialDTO[]}>(`/api/course/${courseId}/materials`, {
    method: 'GET',
  });
}

export async function createMaterial(courseId: number, data: CreateMaterialRequest): Promise<CreateMaterialResponse> {
  return apiFetch<CreateMaterialResponse>(`/api/course/${courseId}/materials`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMaterial(courseId: number, materialId: number): Promise<MaterialDTO> {
  return apiFetch<MaterialDTO>(`/api/course/${courseId}/materials/${materialId}`, {
    method: 'GET',
  });
}

export async function updateMaterial(courseId: number, materialId: number, data: CreateMaterialRequest): Promise<{id: number; message: string}> {
  return apiFetch<{id: number; message: string}>(`/api/course/${courseId}/materials/${materialId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function patchMaterial(courseId: number, materialId: number, data: Partial<CreateMaterialRequest>): Promise<{id: number; message: string}> {
  return apiFetch<{id: number; message: string}>(`/api/course/${courseId}/materials/${materialId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMaterial(courseId: number, materialId: number): Promise<{id: number; message: string}> {
  return apiFetch<{id: number; message: string}>(`/api/course/${courseId}/materials/${materialId}`, {
    method: 'DELETE',
  });
}

// ===== ASSIGNMENTS =====

export async function getCourseAssignments(courseId: number): Promise<{assignments: AssignmentDTO[]}> {
  return apiFetch<{assignments: AssignmentDTO[]}>(`/api/course/${courseId}/assignments`, {
    method: 'GET',
  });
}

export async function createAssignment(courseId: number, data: CreateAssignmentRequest): Promise<CreateAssignmentResponse> {
  return apiFetch<CreateAssignmentResponse>(`/api/course/${courseId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAssignment(courseId: number, assignmentId: number): Promise<AssignmentDTO> {
  return apiFetch<AssignmentDTO>(`/api/course/${courseId}/assignments/${assignmentId}`, {
    method: 'GET',
  });
}

export async function updateAssignment(courseId: number, assignmentId: number, data: CreateAssignmentRequest): Promise<{message: string}> {
  return apiFetch<{message: string}>(`/api/course/${courseId}/assignments/${assignmentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function patchAssignment(courseId: number, assignmentId: number, data: Partial<CreateAssignmentRequest>): Promise<{message: string}> {
  return apiFetch<{message: string}>(`/api/course/${courseId}/assignments/${assignmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAssignment(courseId: number, assignmentId: number): Promise<{message: string}> {
  return apiFetch<{message: string}>(`/api/course/${courseId}/assignments/${assignmentId}`, {
    method: 'DELETE',
  });
}

// ===== ASSIGNMENT RESPONSES =====

export async function getAssignmentResponses(courseId: number, assignmentId: number): Promise<{responses: AssignmentResponseDTO[]}> {
  const result = await apiFetch<{responses: AssignmentResponseDTO[]}>(`/api/course/${courseId}/assignments/${assignmentId}/responses`, {
    method: 'GET',
  });
  
  console.log('Raw API response for assignment responses:', JSON.stringify(result, null, 2));
  
  return result;
}

export async function getMyCourseResponses(courseId: number): Promise<{responses: AssignmentResponseDTO[]}> {
  return apiFetch<{responses: AssignmentResponseDTO[]}>(`/api/course/${courseId}/assignments/my-responses`, {
    method: 'GET',
  });
}

export async function getMyAssignmentResponse(courseId: number, assignmentId: number): Promise<AssignmentResponseDTO> {
  return apiFetch<AssignmentResponseDTO>(`/api/course/${courseId}/assignments/${assignmentId}/responses/my`, {
    method: 'GET',
  });
}

export async function getAssignmentResponse(courseId: number, assignmentId: number, responseId: number): Promise<AssignmentResponseDTO> {
  return apiFetch<AssignmentResponseDTO>(`/api/course/${courseId}/assignments/${assignmentId}/responses/${responseId}`, {
    method: 'GET',
  });
}

export async function submitAssignmentResponse(courseId: number, assignmentId: number, data: CreateAssignmentResponseRequest): Promise<CreateAssignmentResponseResponse> {
  return apiFetch<CreateAssignmentResponseResponse>(`/api/course/${courseId}/assignments/${assignmentId}/responses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function gradeAssignmentResponse(courseId: number, assignmentId: number, responseId: number, data: GradeAssignmentResponseRequest): Promise<{message: string}> {
  return apiFetch<{message: string}>(`/api/course/${courseId}/assignments/${assignmentId}/responses/${responseId}/grade`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function returnAssignmentResponse(courseId: number, assignmentId: number, responseId: number, data: ReturnAssignmentResponseRequest): Promise<{message: string}> {
  return apiFetch<{message: string}>(`/api/course/${courseId}/assignments/${assignmentId}/responses/${responseId}/return`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


