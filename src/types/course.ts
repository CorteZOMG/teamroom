// Course types based on backend API documentation

export type CourseRole = 'OWNER' | 'PROFESSOR' | 'LEADER' | 'STUDENT' | 'VIEWER';

export interface CourseMember {
  username: string;
  role: CourseRole;
  createdAt: string;
}

export interface Course {
  id: number;
  name: string;
  photoUrl?: string;
  isOpen: boolean;
  members: CourseMember[];
}

export interface UserCoursesResponse {
  username: string;
  courses: Course[];
}

export interface CreateCourseRequest {
  name: string;
  photoUrl?: string;
}

export interface CreateCourseResponse {
  courseId: number;
  message: string;
}

export interface AddCourseMemberRequest {
  username: string;
  role: CourseRole;
}

export interface AddCourseMemberResponse {
  username: string;
  courseId: number;
  message: string;
}

export interface PutCourseMemberRoleRequest {
  username: string;
  role: CourseRole;
}

export interface PutCourseMemberRoleResponse {
  username: string;
  newRole: CourseRole;
  message: string;
}

export interface DeleteCourseMemberResponse {
  username: string;
  message: string;
}

// Material types
export interface TagDTO {
  name: string;
}

export interface MaterialMediaDTO {
  id: number;
  name?: string;
  fileUrl: string;
}

export interface MaterialDTO {
  id: number;
  topic: string;
  textContent?: string;
  createdAt: string;
  tags: TagDTO[];
  media: MaterialMediaDTO[];
  authorUsername: string;
}

export interface CreateMaterialRequest {
  topic: string;
  textContent?: string;
  tags: TagDTO[];
  media: Array<{
    name?: string;
    fileUrl: string;
  }>;
}

export interface CreateMaterialResponse {
  id: number;
  message: string;
}

// Assignment types
export interface AssignmentMediaDTO {
  id: number;
  name?: string;
  fileUrl?: string;
}

export interface AssignmentDTO {
  id: number;
  title: string;
  description?: string;
  maxGrade: number;
  createdAt: string;
  deadline: string;
  authorUsername: string;
  media: AssignmentMediaDTO[];
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  maxGrade: number;
  deadline: string;
}

export interface CreateAssignmentResponse {
  id: number;
  message: string;
}

export interface AssignmentResponseMediaDTO {
  id: number;
  name?: string;
  fileUrl?: string;
}

export interface AssignmentResponseDTO {
  id: number;
  authorUsername: string;
  isGraded: boolean;
  grade?: number;
  gradeComment?: string;
  isReturned: boolean;
  returnComment?: string;
  media: AssignmentResponseMediaDTO[];
}

export interface CreateAssignmentResponseRequest {
  media: Array<{
    name?: string;
    fileUrl: string;
  }>;
}

export interface CreateAssignmentResponseResponse {
  id: number;
  message: string;
}

export interface GradeAssignmentResponseRequest {
  grade: number;
  gradeComment?: string;
}

export interface ReturnAssignmentResponseRequest {
  returnComment?: string;
}


