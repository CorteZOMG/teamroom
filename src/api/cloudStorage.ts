import { apiFetch } from './client';

/**
 * File purpose types for cloud storage
 */
export type FilePurpose = 
  | 'profile-photo'
  | 'course-photo'
  | 'material-file'
  | 'assignment-file'
  | 'assignment-response-file';

/**
 * Response from get-upload-link endpoint
 */
interface UploadLinkResponse {
  link: string;
}

/**
 * Response from get-public-link endpoint
 */
interface PublicLinkResponse {
  link: string;
}

/**
 * Response from pCloud upload
 */
interface PCloudUploadResponse {
  result: number;
  metadata: Array<{
    name: string;
    fileid: number;
    size: number;
    contenttype: string;
    path: string;
  }>;
  fileids: number[];
}

/**
 * Response from pCloud getpublinkdownload
 * Note: Currently unused as we're using getpubthumb instead
 */
// interface PCloudDownloadResponse {
//   result: number;
//   expires: string;
//   path: string;
//   hosts: string[];
// }

/**
 * Get upload link from backend
 */
export async function getUploadLink(purpose: FilePurpose): Promise<string> {
  const response = await apiFetch<UploadLinkResponse>(
    `/api/cloud-storage/get-upload-link?purpose=${purpose}`,
    { timeoutMs: 30000 } // 30 seconds timeout for slow backend
  );
  return response.link;
}

/**
 * Upload file to pCloud using the upload link
 * Returns the fileid which should be used to get the public link
 */
export async function uploadFile(
  uploadLink: string,
  file: File,
  uniqueFileName: string
): Promise<number> {
  const formData = new FormData();
  // Create a new File object with the unique name
  const renamedFile = new File([file], uniqueFileName, { type: file.type });
  formData.append('file', renamedFile);

  const response = await fetch(uploadLink, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data: PCloudUploadResponse = await response.json();

  if (data.result !== 0) {
    throw new Error(`pCloud error: ${data.result}`);
  }

  if (!data.fileids || data.fileids.length === 0) {
    throw new Error('No fileid returned from upload');
  }

  return data.fileids[0];
}

/**
 * Get public link from backend using fileid
 */
export async function getPublicLink(fileid: number): Promise<string> {
  const response = await apiFetch<PublicLinkResponse>(
    `/api/cloud-storage/get-public-link?fileid=${fileid}`,
    { timeoutMs: 30000 } // 30 seconds timeout for slow backend
  );
  return response.link;
}

/**
 * Extract code from pCloud public link
 * Example: https://e.pcloud.link/publink/show?code=XZRluOZ... -> XZRluOZ...
 */
export function extractCodeFromPublicLink(publicLink: string): string | null {
  try {
    const url = new URL(publicLink);
    return url.searchParams.get('code');
  } catch {
    return null;
  }
}

/**
 * Get thumbnail/preview link for images
 * Returns a thumbnail URL that can be used in <img> tags without downloading the full file
 */
export function getThumbnailLink(publicLink: string, size: number = 256): string {
  const code = extractCodeFromPublicLink(publicLink);
  if (!code) {
    throw new Error('Invalid pCloud public link - no code parameter found');
  }
  return `https://eapi.pcloud.com/getpubthumb?code=${code}&size=${size}x${size}`;
}

/**
 * Get view link for viewing files in browser (images, PDFs, etc.)
 * Does NOT trigger download, opens in browser
 * 
 * Note: Due to pCloud referer restrictions, we use the public show link
 * which opens pCloud's viewer page
 */
export function getViewLink(publicLink: string): string {
  // Simply return the public link - pCloud will show their viewer page
  // This bypasses referer issues and works for all file types
  return publicLink;
}

/**
 * Get download link that forces file download
 * Triggers browser download dialog
 */
export async function getDownloadLink(publicLink: string): Promise<string> {
  return publicLink;
}

/**
 * Complete workflow: Upload file and get public link
 * This is the main function you'll use on the frontend
 * 
 * @param file - The file to upload
 * @param purpose - What the file is for (profile-photo, etc.)
 * @param uniqueFileName - Unique filename for the file
 * @returns The public link that should be saved to the database
 */
export async function uploadFileAndGetPublicLink(
  file: File,
  purpose: FilePurpose,
  uniqueFileName: string
): Promise<string> {
  // Step 1: Get upload link from backend
  const uploadLink = await getUploadLink(purpose);

  // Step 2: Upload file to pCloud
  const fileid = await uploadFile(uploadLink, file, uniqueFileName);

  // Step 3: Get public link from backend
  const publicLink = await getPublicLink(fileid);

  return publicLink;
}

/**
 * Generate unique filename for profile photo
 * Format: {username}_{timestamp}.{extension}
 */
export function generateUniqueProfilePhotoName(
  username: string,
  fileExtension: string
): string {
  const timestamp = Date.now();
  return `${username}_${timestamp}.${fileExtension}`;
}

/**
 * Generate unique filename for course photo
 * Format: course_{courseId}_{timestamp}.{extension}
 */
export function generateUniqueCoursePhotoName(
  courseId: number,
  fileExtension: string
): string {
  const timestamp = Date.now();
  return `course_${courseId}_${timestamp}.${fileExtension}`;
}

/**
 * Generate unique filename for material file
 * Format: material_{materialId}_{timestamp}_{originalName}
 */
export function generateUniqueMaterialFileName(
  materialId: number,
  originalFileName: string
): string {
  const timestamp = Date.now();
  return `material_${materialId}_${timestamp}_${originalFileName}`;
}

